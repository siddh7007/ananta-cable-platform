import { test } from 'tap';
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';

test('Rate limiting works correctly', async (t) => {
  const server = Fastify({ logger: false });

  // Register plugins with low limits for testing
  await server.register(rateLimit, {
    max: 3, // Very low limit for testing
    timeWindow: 1000, // 1 second window
    global: false,
  });

  // Add a test route with rate limiting
  server.get('/test-rate-limit', { config: { rateLimit: {} } }, async () => {
    return { message: 'success' };
  });

  // Start server
  await server.listen({ port: 0 });
  const address = server.server.address();
  const port = typeof address === 'object' && address ? address.port : 3000;

  try {
    // Make requests up to the limit
    for (let i = 0; i < 3; i++) {
      const response = await fetch(`http://localhost:${port}/test-rate-limit`);
      t.equal(response.status, 200, `Request ${i + 1} should succeed`);
      const data = await response.json();
      t.equal(data.message, 'success');
    }

    // Next request should be rate limited
    const response = await fetch(`http://localhost:${port}/test-rate-limit`);
    t.equal(response.status, 429, 'Request should be rate limited');

    const data = await response.json();
    t.equal(data.message, 'Rate limit exceeded, retry in 1 second', 'Should return default rate limit error');
    // Note: default response doesn't include structured error field
    t.ok(response.headers.get('retry-after'), 'Should have retry-after header');

    // Check rate limit headers
    t.ok(response.headers.get('x-ratelimit-limit'), 'Should have x-ratelimit-limit header');
    t.ok(response.headers.get('x-ratelimit-remaining'), 'Should have x-ratelimit-remaining header');
    t.ok(response.headers.get('retry-after'), 'Should have retry-after header');

  } finally {
    await server.close();
  }
});

test('Health endpoint is not rate limited', async (t) => {
  const server = Fastify({ logger: false });

  // Register plugins with low limits for testing
  await server.register(cors, { origin: true });
  await server.register(rateLimit, {
    max: 1, // Very low limit
    timeWindow: 1000,
    global: false,
  });

  // Health endpoint (should not be rate limited)
  server.get('/health', async () => ({ status: 'ok' }));

  // Rate limited endpoint
  server.get('/protected', { config: { rateLimit: {} } }, async () => ({ message: 'protected' }));

  // Start server
  await server.listen({ port: 0 });
  const address = server.server.address();
  const port = typeof address === 'object' && address ? address.port : 3000;

  try {
    // Health should work multiple times
    for (let i = 0; i < 5; i++) {
      const response = await fetch(`http://localhost:${port}/health`);
      t.equal(response.status, 200, `Health request ${i + 1} should succeed`);
    }

    // Protected endpoint should be limited after 1 request
    const response1 = await fetch(`http://localhost:${port}/protected`);
    t.equal(response1.status, 200, 'First protected request should succeed');

    const response2 = await fetch(`http://localhost:${port}/protected`);
    t.equal(response2.status, 429, 'Second protected request should be rate limited');

  } finally {
    await server.close();
  }
});