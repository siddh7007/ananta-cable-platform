import { FastifyPluginAsync } from 'fastify';

/**
 * Config endpoint for client configuration
 * Returns environment-specific configuration for the portal
 */
const configRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/config', async (request, reply) => {
    // Get environment from NODE_ENV or default to development
    const env = process.env.NODE_ENV || 'development';

    // API base URL - use environment variable or default
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8080';

    // Auth configuration
    const authDomain = process.env.AUTH_DOMAIN || null;
    const authAudience = process.env.AUTH_AUDIENCE || null;

    // Dev bypass - only enabled in development
    const devBypass =
      env === 'development' &&
      (process.env.DEV_BYPASS === 'true' || process.env.DEV_BYPASS === undefined);

    // Feature flags
    const otelEnabled = process.env.OTEL_ENABLED === 'true';
    const featureFlags = (process.env.FEATURE_FLAGS || '').split(',').filter((flag) => flag.trim());

    const config = {
      env,
      apiBaseUrl,
      auth: {
        domain: authDomain,
        audience: authAudience,
        devBypass,
      },
      features: {
        otel: otelEnabled,
        flags: featureFlags,
      },
    };

    reply.send(config);
  });
};

export default configRoute;
