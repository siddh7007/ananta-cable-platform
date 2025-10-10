import Fastify from 'fastify';
import cors from '@fastify/cors';
import { randomUUID } from 'crypto';
import { seedConnectors } from './seed/connectors.js';
import { seedMDMData } from './seed/mdm.js';
import { connectorRoutes } from './routes/connectors.js';
import { assemblyRoutes } from './routes/assemblies.js';
import { presetsRoutes } from './routes/presets.js';
import { assistRoutes } from './routes/assist.js';
import { synthesisRoutes } from './routes/synthesis.js';
import { drcRoutes } from './routes/drc.js';
import { renderRoutes } from './routes/render.js';
import { vendorRoutes } from './routes/vendor.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { adminUsersRoutes } from './routes/admin/users.js';
import { adminDbStatsRoutes } from './routes/admin/db.stats.js';

export async function build() {
  const server = Fastify({ logger: true });
  await server.register(cors, { origin: true });

  // Request ID handling
  server.addHook('onRequest', (req, _reply, done) => {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.id = requestId;
    done();
  });

  server.addHook('onSend', (req, reply, _payload, done) => {
    reply.header('x-request-id', req.id);
    done();
  });

  // Initialize database and seed data
  try {
    // await seedConnectors();
    // await seedMDMData();
    server.log.info('Database initialized (seeding disabled)');
  } catch (error) {
    server.log.error(`Failed to initialize database: ${error}`);
    throw error;
  }

  // Register routes
  await server.register(connectorRoutes);
  await server.register(assemblyRoutes);
  await server.register(presetsRoutes);
  await server.register(assistRoutes);
  await server.register(synthesisRoutes);
  console.log('Registering DRC routes...');
  await server.register(drcRoutes);
  console.log('DRC routes registered successfully');
  console.log('Registering render routes...');
  await server.register(renderRoutes);
  console.log('Render routes registered successfully');
  console.log('Registering vendor routes...');
  try {
    await server.register(vendorRoutes);
    console.log('Vendor routes registered successfully');
  } catch (error) {
    console.error('Failed to register vendor routes:', error);
  }
  console.log('DEBUG: About to register dashboard routes');
  console.log('Registering dashboard routes...');
  try {
    await server.register(dashboardRoutes);
    console.log('Dashboard routes registered successfully');
  } catch (error) {
    console.error('Failed to register dashboard routes:', error);
  }
  console.log('DEBUG: About to register admin users routes');
  console.log('Registering admin users routes...');
  try {
    await server.register(adminUsersRoutes);
    console.log('Admin users routes registered successfully');
  } catch (error) {
    console.error('Failed to register admin users routes:', error);
  }
  console.log('Registering admin DB stats routes...');
  try {
    await server.register(adminDbStatsRoutes);
    console.log('Admin DB stats routes registered successfully');
  } catch (error) {
    console.error('Failed to register admin DB stats routes:', error);
  }

  // Health endpoint
  server.get('/health', async () => ({
    status: 'ok',
    service: 'bff-portal',
    time: new Date().toISOString(),
  }));

  // Me endpoint - protected unless DEV_AUTH_BYPASS=true
  server.get('/me', async (req, reply) => {
    const devBypass = (process.env.DEV_AUTH_BYPASS ?? 'false') === 'true';

    if (!devBypass) {
      return reply.code(401).send({ error: 'unauthorized' });
    }

    return {
      sub: 'dev-user',
      roles: ['dev'],
      features: [],
    };
  });

  // Config endpoint - public, safe client config
  server.get('/config', async () => {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const env = ['development', 'staging', 'production'].includes(nodeEnv)
      ? nodeEnv
      : 'development';

    return {
      env,
      apiBaseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
      auth: {
        domain: process.env.AUTH0_DOMAIN || null,
        audience: process.env.AUTH0_AUDIENCE || null,
        devBypass: (process.env.DEV_AUTH_BYPASS ?? 'false') === 'true',
      },
      features: {
        otel: false,
        flags: [],
      },
    };
  });

  return server;
}
