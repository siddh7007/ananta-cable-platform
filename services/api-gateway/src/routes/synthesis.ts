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
// const synthesisProposalSchema = JSON.parse(readFileSync(join(__dirname, '../../../../packages/contracts/openapi.json'), 'utf8')).components.schemas.SynthesisProposal;
// Using a basic schema for now to avoid $ref resolution issues
const synthesisProposalSchema = {
  type: 'object',
  properties: {
    proposal_id: { type: 'string' },
    draft_id: { type: 'string' },
    cable: { type: 'object' },
    conductors: { type: 'object' },
    endpoints: { type: 'object' },
    shield: { type: 'object' },
    wirelist: { type: 'array' },
    bom: { type: 'array' },
    warnings: { type: 'array', items: { type: 'string' } },
    errors: { type: 'array', items: { type: 'string' } },
    explain: { type: 'array', items: { type: 'string' } }
  },
  required: ['proposal_id', 'draft_id', 'cable', 'conductors', 'endpoints', 'shield', 'wirelist', 'bom', 'warnings', 'errors', 'explain']
};

const synthesisRoutes: FastifyPluginCallback = async (fastify, opts, done) => {
    // POST /v1/synthesis/propose - Generate synthesis proposal
    fastify.post('/v1/synthesis/propose', {
        preHandler: [authGuard],
        config: { rateLimit: {} },
        schema: {
            body: {
                type: 'object',
                properties: {
                    draft_id: { type: 'string' }
                },
                required: ['draft_id']
            },
            response: {
                200: synthesisProposalSchema
            }
        }
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        // Use request ID from headers (already set by logging hook)
        const requestId = req.headers['x-request-id'] as string;
        reply.header('cache-control', 'no-store');

        // Validate Content-Type
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            throw new BadRequest('unsupported media type');
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
            const startTime = process.hrtime.bigint();
            const retryResult: RetryResult = await withChildSpan('synthesis.propose', {
                'http.method': 'POST',
                'http.target': '/v1/synthesis/propose',
                'upstream.url': 'http://bff-portal:4001/v1/synthesis/propose',
                'user.sub': req.user?.sub || undefined,
                'request.id': requestId
            }, async () => {
                return await fetchWithRetry('http://bff-portal:4001/v1/synthesis/propose', {
                    method: 'POST',
                    headers: upstreamHeaders,
                    body: JSON.stringify(req.body),
                }, 1, // 1 retry
                10000, // 10s timeout for synthesis
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
                    msg: 'Synthesis propose upstream retry occurred',
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

    // POST /v1/synthesis/recompute - Recompute with user locks
    fastify.post('/v1/synthesis/recompute', {
        preHandler: [authGuard],
        config: { rateLimit: {} },
        schema: {
            body: {
                type: 'object',
                properties: {
                    draft_id: { type: 'string' },
                    locks: { type: 'array', items: { type: 'string' } }
                },
                required: ['draft_id']
            },
            response: {
                200: synthesisProposalSchema
            }
        }
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const requestId = req.headers['x-request-id'] as string;
        reply.header('cache-control', 'no-store');

        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            throw new BadRequest('unsupported media type');
        }

        const upstreamHeaders: Record<string, string> = {
            'content-type': 'application/json',
            'x-request-id': requestId,
        };

        if (req.headers['x-trace-id']) {
            upstreamHeaders['x-trace-id'] = req.headers['x-trace-id'] as string;
        }

        try {
            const startTime = process.hrtime.bigint();
            const retryResult: RetryResult = await withChildSpan('synthesis.recompute', {
                'http.method': 'POST',
                'http.target': '/v1/synthesis/recompute',
                'upstream.url': 'http://bff-portal:4001/v1/synthesis/recompute',
                'user.sub': req.user?.sub || undefined,
                'request.id': requestId
            }, async () => {
                return await fetchWithRetry('http://bff-portal:4001/v1/synthesis/recompute', {
                    method: 'POST',
                    headers: upstreamHeaders,
                    body: JSON.stringify(req.body),
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
                    msg: 'Synthesis recompute upstream retry occurred',
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

    // POST /v1/synthesis/accept - Accept proposal and create assembly
    fastify.post('/v1/synthesis/accept', {
        preHandler: [authGuard],
        config: { rateLimit: {} },
        schema: {
            body: {
                type: 'object',
                properties: {
                    proposal_id: { type: 'string' },
                    locks: { type: 'array', items: { type: 'string' } }
                },
                required: ['proposal_id']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        assembly_id: { type: 'string' },
                        schema_hash: { type: 'string' }
                    }
                }
            }
        }
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        const requestId = req.headers['x-request-id'] as string;
        reply.header('cache-control', 'no-store');

        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            throw new BadRequest('unsupported media type');
        }

        const upstreamHeaders: Record<string, string> = {
            'content-type': 'application/json',
            'x-request-id': requestId,
        };

        if (req.headers['x-trace-id']) {
            upstreamHeaders['x-trace-id'] = req.headers['x-trace-id'] as string;
        }

        try {
            const startTime = process.hrtime.bigint();
            const retryResult: RetryResult = await withChildSpan('synthesis.accept', {
                'http.method': 'POST',
                'http.target': '/v1/synthesis/accept',
                'upstream.url': 'http://bff-portal:4001/v1/synthesis/accept',
                'user.sub': req.user?.sub || undefined,
                'request.id': requestId
            }, async () => {
                return await fetchWithRetry('http://bff-portal:4001/v1/synthesis/accept', {
                    method: 'POST',
                    headers: upstreamHeaders,
                    body: JSON.stringify(req.body),
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
                    msg: 'Synthesis accept upstream retry occurred',
                    requestId,
                    retryCount,
                    upstreamLatencyMs,
                    finalStatus: response.status,
                    userSub: req.user?.sub
                });
            }

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

export default synthesisRoutes;