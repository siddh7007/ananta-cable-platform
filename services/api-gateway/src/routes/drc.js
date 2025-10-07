import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { authGuard } from '../auth.js';
import { validateCableDesign, validateDRCResult } from '@cable-platform/validation';
import { fetchWithRetry, HttpError } from '../http.js';
import { withChildSpan } from '../otel.js';
import { trace } from '@opentelemetry/api';
import { BadRequest, UpstreamUnavailable, UpstreamInvalidPayload, UpstreamBadRequest } from '../errors.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load schemas at runtime to avoid JSON import issues
const cableDesignSchema = JSON.parse(readFileSync(join(__dirname, '../../../../shared/contracts/schemas/v1/cable-design.schema.json'), 'utf8'));
const drcResultSchema = JSON.parse(readFileSync(join(__dirname, '../../../../shared/contracts/schemas/v1/drc-result.schema.json'), 'utf8'));
const drcRoutes = async (fastify, opts, done) => {
    fastify.post('/v1/drc/run', {
        preHandler: [authGuard],
        config: { rateLimit: {} },
        schema: {
            body: cableDesignSchema,
            response: {
                200: drcResultSchema
            }
        }
    }, async (req, reply) => {
        // Use request ID from headers (already set by logging hook)
        const requestId = req.headers['x-request-id'];
        reply.header('cache-control', 'no-store');
        // Validate Content-Type
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            throw new BadRequest('unsupported media type');
        }
        // Validate request body
        const validation = validateCableDesign(req.body);
        if (!validation.ok) {
            throw new BadRequest('validation failed', { errors: validation.errors });
        }
        // Prepare headers for upstream call (forward only safe headers)
        const upstreamHeaders = {
            'content-type': 'application/json',
            'x-request-id': requestId,
        };
        // Forward trace/request-id if present
        if (req.headers['x-trace-id']) {
            upstreamHeaders['x-trace-id'] = req.headers['x-trace-id'];
        }
        try {
            // Make upstream call with timeout and retry
            const startTime = process.hrtime.bigint();
            const response = await withChildSpan('drc.run', {
                'http.method': 'POST',
                'http.target': '/v1/drc/run',
                'upstream.url': 'http://drc:8000/v1/drc/run',
                'user.sub': req.user?.sub || undefined,
                'request.id': requestId
            }, async () => {
                return await fetchWithRetry('http://drc:8000/v1/drc/run', {
                    method: 'POST',
                    headers: upstreamHeaders,
                    body: JSON.stringify(validation.data),
                }, 1, // 1 retry
                5000 // 5s timeout
                );
            });
            // Calculate upstream latency and add span attributes
            const upstreamLatencyMs = Number(process.hrtime.bigint() - startTime) / 1000000;
            const span = trace.getActiveSpan();
            if (span) {
                span.setAttribute('http.status_code', response.status);
                span.setAttribute('upstream.latency_ms', upstreamLatencyMs);
                span.setAttribute('retry.count', 1); // We always do 1 retry attempt
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
            return reply.code(200).send(resultValidation.data);
        }
        catch (error) {
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
