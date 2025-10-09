import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnsupportedMediaType } from './errors.js';

/**
 * Enforce JSON content negotiation for API endpoints
 * - Requires Content-Type: application/json for requests with bodies
 * - Requires Accept header to be application/json or *
 */
export function enforceJsonContentNegotiation(req: FastifyRequest, reply: FastifyReply, done: () => void) {
  // Skip content negotiation for health/readiness endpoints
  if (req.url === '/health' || req.url === '/ready' || req.url.startsWith('/docs/')) {
    return done();
  }

  // Check Content-Type for requests with bodies
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      throw new UnsupportedMediaType('Content-Type must be application/json');
    }
  }

  // Check Accept header
  const accept = req.headers.accept;
  if (accept && accept !== '*/*' && !accept.includes('application/json')) {
    throw new UnsupportedMediaType('Accept header must be application/json or */*');
  }

  // Ensure response Content-Type is set to JSON
  reply.header('content-type', 'application/json; charset=utf-8');

  done();
}