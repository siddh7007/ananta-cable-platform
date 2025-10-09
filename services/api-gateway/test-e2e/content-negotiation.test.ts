import { test } from 'tap';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { attachRequestLogging } from '../src/logging.js';
import { enforceJsonContentNegotiation } from '../src/content-negotiation.js';
import { toResponse } from '../src/errors.js';

test('JSON Content Negotiation E2E tests', async (t) => {
  const server = Fastify({ logger: false });

  // Register plugins (minimal setup for testing)
  const PORTAL_ORIGIN = process.env.PORTAL_ORIGIN ?? "http://localhost:5173";
  await server.register(cors, {
    origin: PORTAL_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true
  });
  await server.register(rateLimit, {
    max: 100,
    timeWindow: 60000,
    global: false,
  });

  // Attach request logging and content negotiation
  attachRequestLogging(server);
  server.addHook('preHandler', enforceJsonContentNegotiation);

  // Global error handler (same as main app)
  server.setErrorHandler((err, _req, reply) => {
    const { status, body } = toResponse(err);
    reply.code(status).headers({ 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' }).send(body);
  });

  // Add test endpoints
  server.post("/test-json", async (req, reply) => {
    return { received: req.body, method: 'POST' };
  });

  server.get("/test-get", async (req, reply) => {
    return { message: 'GET request successful' };
  });

  // Add health endpoint (minimal implementation for testing)
  server.get("/health", async () => ({
    status: "ok",
    service: "api-gateway",
    time: new Date().toISOString(),
    version: "dev"
  }));

  // Start server
  await server.listen({ port: 0 });
  const address = server.server.address();
  const port = typeof address === 'object' && address ? address.port : 8080;
  const baseUrl = `http://localhost:${port}`;

  try {
    // Test 1: POST with correct Content-Type should succeed
    await t.test('POST with application/json Content-Type succeeds', async (t) => {
      const response = await fetch(`${baseUrl}/test-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ test: 'data' })
      });

      t.equal(response.status, 200, 'Should return 200 OK');
      t.equal(response.headers.get('content-type'), 'application/json; charset=utf-8', 'Should set JSON content-type in response');

      const data = await response.json();
      t.equal(data.received.test, 'data', 'Should receive correct data');
    });

    // Test 2: POST with wrong Content-Type should return 415
    await t.test('POST with wrong Content-Type returns 415', async (t) => {
      const response = await fetch(`${baseUrl}/test-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ test: 'data' })
      });

      t.equal(response.status, 415, 'Should return 415 Unsupported Media Type');
      t.equal(response.headers.get('content-type'), 'application/json; charset=utf-8', 'Should set JSON content-type in error response');

      const data = await response.json();
      t.equal(data.error, 'unsupported_media_type', 'Should return unsupported_media_type error');
      t.equal(data.message, 'Content-Type must be application/json', 'Should return correct error message');
    });

    // Test 3: POST with wrong Accept header should return 415
    await t.test('POST with wrong Accept header returns 415', async (t) => {
      const response = await fetch(`${baseUrl}/test-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/html'
        },
        body: JSON.stringify({ test: 'data' })
      });

      t.equal(response.status, 415, 'Should return 415 Unsupported Media Type');

      const data = await response.json();
      t.equal(data.error, 'unsupported_media_type', 'Should return unsupported_media_type error');
      t.equal(data.message, 'Accept header must be application/json or */*', 'Should return correct error message');
    });

    // Test 4: POST with */* Accept header should succeed
    await t.test('POST with */* Accept header succeeds', async (t) => {
      const response = await fetch(`${baseUrl}/test-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        body: JSON.stringify({ test: 'data' })
      });

      t.equal(response.status, 200, 'Should return 200 OK');
      t.equal(response.headers.get('content-type'), 'application/json; charset=utf-8', 'Should set JSON content-type in response');
    });

    // Test 5: GET request should succeed (no Content-Type required)
    await t.test('GET request succeeds without Content-Type', async (t) => {
      const response = await fetch(`${baseUrl}/test-get`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      t.equal(response.status, 200, 'Should return 200 OK');
      t.equal(response.headers.get('content-type'), 'application/json; charset=utf-8', 'Should set JSON content-type in response');

      const data = await response.json();
      t.equal(data.message, 'GET request successful', 'Should return correct data');
    });

    // Test 6: Health endpoint should skip content negotiation
    await t.test('Health endpoint skips content negotiation', async (t) => {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET'
      });

      t.equal(response.status, 200, 'Should return 200 OK');
      // Health endpoint doesn't set content-type, so we don't check it
    });

  } finally {
    await server.close();
  }
});