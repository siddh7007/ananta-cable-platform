import { test } from 'tap';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { attachRequestLogging } from '../src/logging.js';

test('Vendor Mouser ping endpoint respects DEV_VENDOR flag and proxies to BFF', async (t) => {
  process.env.DEV_AUTH_BYPASS = 'true';

  const bff = Fastify({ logger: false });
  let pingCount = 0;

  bff.get('/v1/vendor/mouser/ping', async () => {
    pingCount += 1;
    return {
      status: 'ok',
      service: 'vendor-integration',
      vendors: {
        mouser: {
          configured: true,
          status: 'configured'
        }
      }
    };
  });

  await bff.listen({ port: 0 });
  const bffAddress = bff.server.address();
  const bffPort = typeof bffAddress === 'object' && bffAddress ? bffAddress.port : 0;
  const bffBaseUrl = `http://127.0.0.1:${bffPort}`;
  process.env.BFF_PORTAL_URL = bffBaseUrl;

  const server = Fastify({ logger: false });

  const PORTAL_ORIGIN = process.env.PORTAL_ORIGIN ?? 'http://localhost:5173';
  await server.register(cors, {
    origin: PORTAL_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  });
  await server.register(rateLimit, {
    max: 100,
    timeWindow: 60000,
    global: false
  });

  attachRequestLogging(server);

  const vendorRoutes = (await import('../src/routes/vendor.js')).default;
  await server.register(vendorRoutes);

  await server.listen({ port: 0 });
  const address = server.server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await t.test('returns 404 when DEV_VENDOR flag disabled', async (t) => {
      process.env.DEV_VENDOR = 'false';

      const response = await fetch(`${baseUrl}/v1/vendor/mouser/ping`, {
        method: 'GET',
        headers: {
          accept: 'application/json'
        }
      });

      t.equal(response.status, 404, 'Should return 404 when disabled');
      const payload = await response.json();
      t.equal(payload.error, 'not_found', 'Should include not_found error code');
      t.equal(pingCount, 0, 'Should not call BFF when disabled');
    });

    await t.test('proxies to BFF when DEV_VENDOR flag enabled', async (t) => {
      process.env.DEV_VENDOR = 'true';

      const response = await fetch(`${baseUrl}/v1/vendor/mouser/ping`, {
        method: 'GET',
        headers: {
          accept: 'application/json'
        }
      });

      t.equal(response.status, 200, 'Should return 200 when enabled');
      const payload = await response.json();
      t.same(payload.vendors.mouser.configured, true, 'Should proxy configured status');
      t.equal(pingCount, 1, 'Should forward request to BFF once');
    });
  } finally {
    await server.close();
    await bff.close();
    delete process.env.DEV_VENDOR;
    delete process.env.BFF_PORTAL_URL;
    delete process.env.DEV_AUTH_BYPASS;
  }
});
