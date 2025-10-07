import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify';
import { authGuard } from '../auth.js';
import { validateCableDesign, validateDRCResult } from '@cable-platform/validation';
import { fetchWithRetry, HttpError } from '../http.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schemas at runtime to avoid JSON import issues
const cableDesignSchema = JSON.parse(readFileSync(join(__dirname, '../../../../shared/contracts/schemas/v1/cable-design.schema.json'), 'utf8'));
const drcResultSchema = JSON.parse(readFileSync(join(__dirname, '../../../../shared/contracts/schemas/v1/drc-result.schema.json'), 'utf8'));

const drcRoutes: FastifyPluginCallback = async (fastify, opts, done) => {
  fastify.post('/v1/drc/run', {
    preHandler: [authGuard],
    config: { rateLimit: {} },
    schema: {
      body: cableDesignSchema,
      response: {
        200: drcResultSchema
      }
    }
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    // Use request ID from headers (already set by logging hook)
    const requestId = req.headers['x-request-id'] as string;
    reply.header('cache-control', 'no-store');

    // Validate Content-Type
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return reply.code(415).send({ error: 'unsupported_media_type' });
    }

    // Validate request body
    const validation = validateCableDesign(req.body);
    if (!validation.ok) {
      return reply.code(400).send({
        error: 'bad_request',
        details: validation.errors
      });
    }

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
      const response = await fetchWithRetry(
        'http://drc:8000/v1/drc/run',
        {
          method: 'POST',
          headers: upstreamHeaders,
          body: JSON.stringify(validation.data),
        },
        1, // 1 retry
        5000 // 5s timeout
      );

      // Handle different upstream response codes
      if (response.status === 400) {
        return reply.code(502).send({ error: 'upstream_bad_request' });
      }

      if (response.status === 401 || response.status === 403) {
        return reply.code(502).send({ error: 'upstream_auth_error' });
      }

      if (response.status === 404) {
        return reply.code(502).send({ error: 'upstream_not_found' });
      }

      if (response.status >= 500 || !response.ok) {
        return reply.code(502).send({ error: 'upstream_unavailable' });
      }

      // Parse and validate upstream response
      const responseData = await response.json();

      const resultValidation = validateDRCResult(responseData);
      if (!resultValidation.ok) {
        return reply.code(502).send({ error: 'upstream_invalid_payload' });
      }

      return reply.code(200).send(resultValidation.data);

    } catch (error) {
      if (error instanceof HttpError && error.status === 408) {
        return reply.code(502).send({ error: 'upstream_unavailable' });
      }

      // Network or other errors
      return reply.code(502).send({ error: 'upstream_unavailable' });
    }
  });

  done();
};

export default drcRoutes;