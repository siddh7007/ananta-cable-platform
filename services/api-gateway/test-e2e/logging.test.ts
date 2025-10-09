import { test } from 'tap';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { getLoggerConfig, attachRequestLogging } from '../src/logging.js';

test('Request/Response logging E2E test', async (t) => {
  const logs: {
    event: string;
    id?: string;
    method?: string;
    url?: string;
    ip?: string;
    statusCode?: number;
    latency_ms?: number;
    req_size?: number;
    res_size?: number;
  }[] = [];

  const loggerConfig = getLoggerConfig({
    LOG_LEVEL: 'info',
    NODE_ENV: 'test'
  });

  // Create a custom logger that captures logs
  const customLogger = {
    ...loggerConfig,
    stream: {
      write: (chunk: string) => {
        try {
          const log = JSON.parse(chunk);
          logs.push(log);
        } catch (e) {
          // Ignore non-JSON logs
        }
      }
    }
  };

  const server = Fastify({
    logger: customLogger,
    ajv: {
      customOptions: {
        strict: true,
        allErrors: true,
        allowUnionTypes: true
      },
      plugins: []
    }
  });

  // Register plugins
  await server.register(cors, { origin: true });
  await server.register(rateLimit, {
    max: 100,
    timeWindow: 60000,
    global: false,
  });

  // Attach logging
  attachRequestLogging(server);

  // Add test routes
  server.get("/health", async () => ({
    status: "ok",
    service: "api-gateway",
    time: new Date().toISOString(),
    version: "test"
  }));

  // Start server
  await server.listen({ port: 0 });
  const address = server.server.address();
  const port = typeof address === 'object' && address ? address.port : 3000;
  const baseUrl = `http://localhost:${port}`;

  try {
    // Make a request
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json();

    // Check response
    t.equal(response.status, 200);
    t.equal(data.status, 'ok');
    t.equal(data.service, 'api-gateway');

    // Check that x-request-id header is present
    t.ok(response.headers.get('x-request-id'));

    // Wait a bit for logs to be written
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check logs
    const reqStartLogs = logs.filter(log => log.event === 'req_start');
    const reqEndLogs = logs.filter(log => log.event === 'req_end');

    t.equal(reqStartLogs.length, 1);
    t.equal(reqEndLogs.length, 1);

    const reqStart = reqStartLogs[0];
    const reqEnd = reqEndLogs[0];

    // Check req_start log
    t.equal(reqStart.event, 'req_start');
    t.ok(reqStart.id);
    t.equal(reqStart.method, 'GET');
    t.equal(reqStart.url, '/health');
    t.ok(reqStart.ip);

    // Check req_end log
    t.equal(reqEnd.event, 'req_end');
    t.equal(reqEnd.id, reqStart.id); // Same request ID
    t.equal(reqEnd.method, 'GET');
    t.equal(reqEnd.url, '/health');
    t.equal(reqEnd.statusCode, 200);
    t.ok(typeof reqEnd.latency_ms === 'number');
    t.ok(typeof reqEnd.req_size === 'number' && reqEnd.req_size >= 0);
    t.ok(typeof reqEnd.res_size === 'number' && reqEnd.res_size >= 0);

  } finally {
    await server.close();
  }
});