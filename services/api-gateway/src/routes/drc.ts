import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify';
import { authGuard } from '../auth.js';
import { validateCableDesign, validateDRCResult } from '@cable-platform/validation';
import { fetchWithRetry, RetryResult, HttpError } from '../http.js';
import { withChildSpan } from '../otel.js';
import { trace } from '@opentelemetry/api';
import { BadRequest, UpstreamUnavailable, UpstreamInvalidPayload, UpstreamBadRequest, UnsupportedMediaType } from '../errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const openapiSpec = JSON.parse(
  readFileSync(join(__dirname, '../../../../packages/contracts/openapi.json'), 'utf8')
);

const DRC_ANALYTICS_ENABLED = (process.env.OTEL_DRC_ANALYTICS ?? 'false') === 'true';

const recordDrcSubmitAttributes = (designId: string | undefined, severitySummary: Record<string, unknown> | undefined) => {
  if (!DRC_ANALYTICS_ENABLED) {
    return;
  }
  const span = trace.getActiveSpan();
  if (!span) {
    return;
  }
  span.setAttribute('event', 'cable.drc.submit');
  if (designId) {
    span.setAttribute('design_id', designId);
  }
  if (severitySummary) {
    span.setAttribute('severity_counts', JSON.stringify(severitySummary));
  }
};

const drcRoutes: FastifyPluginCallback = async (fastify, opts, done) => {
  fastify.post('/v1/drc/run', {
    preHandler: [authGuard],
    config: { rateLimit: {} },
    // Schema validation removed - handled by BFF layer and DRC service
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    // Use request ID from headers (already set by logging hook)
    const requestId = req.headers['x-request-id'] as string;
    reply.header('cache-control', 'no-store');

    // Validate Content-Type
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      throw new UnsupportedMediaType('Content-Type must be application/json');
    }

    // Validate request body
    const validation = validateCableDesign(req.body);
    if (!validation.ok) {
      throw new BadRequest('validation failed', { errors: validation.errors });
    }
    const cableDesign = validation.data;

    // Prepare headers for upstream call (forward only safe headers)
    const upstreamHeaders: Record<string, string> = {
      'content-type': 'application/json',
      'x-request-id': requestId,
    };

    // Forward trace/request-id if present
    if (req.headers['x-trace-id']) {
      upstreamHeaders['x-trace-id'] = req.headers['x-trace-id'] as string;
    }

    try {
      // Make upstream call with timeout and retry
      const startTime = process.hrtime.bigint();
      const retryResult: RetryResult = await withChildSpan('drc.run', {
        'http.method': 'POST',
        'http.target': '/v1/drc/run',
        'upstream.url': 'http://drc:8000/v1/drc/run',
        'user.sub': req.user?.sub || undefined,
        'request.id': requestId
      }, async () => {
        return await fetchWithRetry(
          'http://drc:8000/v1/drc/run',
          {
            method: 'POST',
            headers: upstreamHeaders,
            body: JSON.stringify(cableDesign),
          },
          1, // 1 retry
          5000, // 5s timeout
          1000 // 1s base backoff
        );
      });

      const { response, retryCount } = retryResult;

      // Calculate upstream latency and add span attributes
      const upstreamLatencyMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
      const span = trace.getActiveSpan();
      if (span) {
        span.setAttribute('http.status_code', response.status);
        span.setAttribute('upstream.latency_ms', upstreamLatencyMs);
        span.setAttribute('retry.count', retryCount);
        span.setAttribute('upstream.retried', retryCount > 0);
      }

      // Log retry metrics
      if (retryCount > 0) {
        fastify.log.info({
          msg: 'DRC upstream retry occurred',
          requestId,
          retryCount,
          upstreamLatencyMs,
          finalStatus: response.status,
          userSub: req.user?.sub
        });
      }

      // Handle different upstream response codes
      if (response.status === 400) {
        throw new UpstreamBadRequest();
      }

      if (response.status === 401 || response.status === 403) {
        throw new UpstreamBadRequest();
      }

      if (response.status === 404) {
        throw new UpstreamBadRequest();
      }

      if (response.status >= 500 || !response.ok) {
        throw new UpstreamUnavailable();
      }

      // Parse and validate upstream response
      const responseData = await response.json();

      const resultValidation = validateDRCResult(responseData);
      if (!resultValidation.ok) {
        throw new UpstreamInvalidPayload();
      }
      const drcResult = resultValidation.data;
      recordDrcSubmitAttributes(cableDesign.id, drcResult.severity_summary);
      return reply.code(200).send(drcResult);

    } catch (error) {
      if (error instanceof HttpError && error.status === 408) {
        throw new UpstreamUnavailable();
      }

      // Network or other errors
      throw new UpstreamUnavailable();
    }
  });

  done();
};

export default drcRoutes;
