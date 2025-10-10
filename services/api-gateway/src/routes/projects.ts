import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify';
import { authGuard } from '../auth.js';
import { fetchWithRetry, RetryResult, HttpError } from '../http.js';
import { withChildSpan } from '../otel.js';
import { trace } from '@opentelemetry/api';
import { BadRequest, UpstreamUnavailable, UpstreamInvalidPayload, UpstreamBadRequest } from '../errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load schemas at runtime to avoid JSON import issues
// Using basic schemas for now to avoid $ref resolution issues
const projectListSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'active', 'archived'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    total: { type: 'integer', minimum: 0 },
  },
};

const projectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    status: { type: 'string', enum: ['draft', 'active', 'archived'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const projectsRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  // GET /v1/projects - List projects
  fastify.get('/v1/projects', {
    preHandler: [authGuard],
    config: { rateLimit: {} },
    schema: {
      response: {
        200: projectListSchema,
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const requestId = req.headers['x-request-id'] as string;
    reply.header('cache-control', 'no-store');

    const upstreamHeaders: Record<string, string> = {
      'accept': 'application/json',
      'x-request-id': requestId,
    };

    if (req.headers['x-trace-id']) {
      upstreamHeaders['x-trace-id'] = req.headers['x-trace-id'] as string;
    }

    try {
      const startTime = process.hrtime.bigint();
      const retryResult: RetryResult = await withChildSpan('projects.list', {
        'http.method': 'GET',
        'http.target': '/v1/projects',
        'upstream.url': 'http://bff-portal:4001/v1/projects',
        'user.sub': req.user?.sub || undefined,
        'request.id': requestId,
      }, async () => {
        return await fetchWithRetry('http://bff-portal:4001/v1/projects', {
          method: 'GET',
          headers: upstreamHeaders,
        }, 1,
        10000, // 10s timeout
        1000 // 1s base backoff
        );
      });

      const { response, retryCount } = retryResult;

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
          msg: 'Projects list upstream retry occurred',
          requestId,
          retryCount,
          upstreamLatencyMs,
          finalStatus: response.status,
          userSub: req.user?.sub,
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

      // Parse and return upstream response
      const responseData = await response.json();
      return reply.code(200).send(responseData);
    }
    catch (error) {
      if (error instanceof HttpError && error.status === 408) {
        throw new UpstreamUnavailable();
      }
      throw new UpstreamUnavailable();
    }
  });

  // GET /v1/projects/:id - Get project by ID
  fastify.get('/v1/projects/:id', {
    preHandler: [authGuard],
    config: { rateLimit: {} },
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: projectSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const requestId = req.headers['x-request-id'] as string;
    reply.header('cache-control', 'no-store');

    const { id } = req.params as { id: string };
    const upstreamHeaders: Record<string, string> = {
      'accept': 'application/json',
      'x-request-id': requestId,
    };

    if (req.headers['x-trace-id']) {
      upstreamHeaders['x-trace-id'] = req.headers['x-trace-id'] as string;
    }

    try {
      const startTime = process.hrtime.bigint();
      const retryResult: RetryResult = await withChildSpan('projects.get', {
        'http.method': 'GET',
        'http.target': `/v1/projects/${id}`,
        'upstream.url': `http://bff-portal:4001/v1/projects/${id}`,
        'user.sub': req.user?.sub || undefined,
        'request.id': requestId,
      }, async () => {
        return await fetchWithRetry(`http://bff-portal:4001/v1/projects/${id}`, {
          method: 'GET',
          headers: upstreamHeaders,
        }, 1,
        10000, // 10s timeout
        1000 // 1s base backoff
        );
      });

      const { response, retryCount } = retryResult;

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
          msg: 'Projects get upstream retry occurred',
          requestId,
          retryCount,
          upstreamLatencyMs,
          finalStatus: response.status,
          userSub: req.user?.sub,
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
        const errorData = await response.json();
        return reply.code(404).send(errorData);
      }
      if (response.status >= 500 || !response.ok) {
        throw new UpstreamUnavailable();
      }

      // Parse and return upstream response
      const responseData = await response.json();
      return reply.code(200).send(responseData);
    }
    catch (error) {
      if (error instanceof HttpError && error.status === 408) {
        throw new UpstreamUnavailable();
      }
      throw new UpstreamUnavailable();
    }
  });

  done();
};

export default projectsRoutes;