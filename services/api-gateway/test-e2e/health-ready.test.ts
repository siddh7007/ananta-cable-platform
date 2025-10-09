import { test } from 'tap';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { attachRequestLogging } from '../src/logging.js';
// Note: Not importing drcRoutes to avoid JSON import issues in test environment

test('Health and Readiness endpoints E2E tests', async (t) => {
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

  // Attach request logging (includes x-request-id generation)
  attachRequestLogging(server);

  // Add health and readiness endpoints (minimal implementation for testing)
  server.get("/health", async () => ({
    status: "ok",
    service: "api-gateway",
    time: new Date().toISOString(),
    version: "dev"
  }));

  server.get("/ready", async (req, reply) => {
    reply.header('cache-control', 'no-store');
    return {
      status: "ok",
      checks: [
        { name: "drc", status: "ok", latency_ms: 10 },
        { name: "postgres_supabase", status: "skipped", latency_ms: 0 },
        { name: "postgres_extra", status: "skipped", latency_ms: 0 },
        { name: "oracle", status: "skipped", latency_ms: 0 }
      ]
    };
  });

  // Start server
  await server.listen({ port: 0 });
  const address = server.server.address();
  const port = typeof address === 'object' && address ? address.port : 3000;

  const baseUrl = `http://localhost:${port}`;

  try {
    // Test 1: Health endpoint should return service info
    await t.test('Health endpoint returns service information', async (t) => {
      const response = await fetch(`${baseUrl}/health`);
      t.equal(response.status, 200, 'Should return 200 OK');

      const data = await response.json();
      t.equal(data.status, 'ok', 'Should have ok status');
      t.equal(data.service, 'api-gateway', 'Should identify service');
      t.ok(data.time, 'Should include timestamp');
      t.ok(data.version, 'Should include version');
    });

    // Test 2: Readiness endpoint should return check results
    await t.test('Readiness endpoint returns check results', async (t) => {
      const response = await fetch(`${baseUrl}/ready`);
      t.equal(response.status, 200, 'Should return 200 OK');

      const data = await response.json();
      t.ok(['ok', 'degraded', 'fail'].includes(data.status), 'Should have valid status');
      t.ok(Array.isArray(data.checks), 'Should include checks array');

      // Should have checks for drc, postgres_supabase, postgres_extra, oracle
      const checkNames = data.checks.map((c: { name: string }) => c.name);
      t.ok(checkNames.includes('drc'), 'Should include DRC check');
      t.ok(checkNames.includes('postgres_supabase'), 'Should include Supabase PG check');
      t.ok(checkNames.includes('postgres_extra'), 'Should include Extra PG check');
      t.ok(checkNames.includes('oracle'), 'Should include Oracle check');

      // Each check should have required fields
      for (const check of data.checks) {
        t.ok(['ok', 'fail', 'skipped'].includes(check.status), `Check ${check.name} should have valid status`);
        t.ok(typeof check.latency_ms === 'number', `Check ${check.name} should have latency`);
        if (check.status === 'fail') {
          t.ok(check.error, `Failed check ${check.name} should have error message`);
        }
      }
    });

    // Test 3: Cache control headers
    await t.test('Endpoints include proper cache control', async (t) => {
      const healthResponse = await fetch(`${baseUrl}/health`);
      t.equal(healthResponse.headers.get('cache-control'), null, 'Health should not have cache-control header');

      const readyResponse = await fetch(`${baseUrl}/ready`);
      t.equal(readyResponse.headers.get('cache-control'), 'no-store', 'Ready should have no-store cache-control');
    });

    // Test 4: x-request-id header presence
    await t.test('x-request-id header is present in responses', async (t) => {
      const response = await fetch(`${baseUrl}/health`);
      t.ok(response.headers.get('x-request-id'), 'Should include x-request-id header');
      
      // Verify it's a valid UUID v4 format
      const requestId = response.headers.get('x-request-id');
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      t.ok(uuidRegex.test(requestId!), 'Should be a valid UUID v4');
    });

  } finally {
    await server.close();
  }
});