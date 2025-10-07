import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { FastifyRequest } from "fastify";
import { authGuard, required } from "./auth.js";
import { runReadinessChecks } from "./readiness.js";
import { getAjv } from "@cable-platform/validation";
import { getLoggerConfig, attachRequestLogging } from "./logging.js";

const loggerConfig = getLoggerConfig(process.env);

const server = Fastify({ 
  logger: loggerConfig,
  ajv: {
    customOptions: {
      strict: true,
      allErrors: true,
      allowUnionTypes: true
    },
    plugins: []
  }
});

// Set custom AJV instance with schemas
server.setValidatorCompiler(({ schema, method: _method, url: _url, httpPart: _httpPart }) => {
  return getAjv().compile(schema);
});

await server.register(cors, { origin: true });

// Attach request logging hooks
attachRequestLogging(server);

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 100);
const RATE_LIMIT_TRUST_PROXY = (process.env.RATE_LIMIT_TRUST_PROXY ?? "true") === "true";
const RATE_LIMIT_WHITELIST = (process.env.RATE_LIMIT_WHITELIST ?? "").split(",").filter(Boolean);
const DEV_BYPASS = (process.env.DEV_AUTH_BYPASS ?? "false") === "true";

// Apply 5x multiplier for dev bypass
const effectiveMax = DEV_BYPASS ? RATE_LIMIT_MAX * 5 : RATE_LIMIT_MAX;

// Readiness check configuration
const READINESS_TIMEOUT_MS = Number(process.env.READINESS_TIMEOUT_MS ?? 2000);
const READINESS_CACHE_MS = Number(process.env.READINESS_CACHE_MS ?? 500);

// Simple in-memory cache for readiness checks
let readinessCache: { data: { status: string; checks: { name: string; status: string; latency_ms: number }[] }; timestamp: number } | null = null;

await server.register(rateLimit, {
  max: effectiveMax,
  timeWindow: RATE_LIMIT_WINDOW_MS,
  allowList: RATE_LIMIT_WHITELIST,
  global: false, // Disable global rate limiting
  keyGenerator: (req: FastifyRequest) => {
    // Get IP address
    let ip: string;
    if (RATE_LIMIT_TRUST_PROXY) {
      ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip;
    } else {
      ip = req.ip;
    }

    // If user is authenticated, use composite key for per-user fairness
    if (req.user?.sub) {
      return `${ip}:${req.user.sub}`;
    }

    return ip;
  },
  errorResponseBuilder: (req: FastifyRequest, context: { ttl?: number }) => {
    return {
      error: "rate_limited",
      message: "Rate limit exceeded",
      retry_after_ms: context.ttl || RATE_LIMIT_WINDOW_MS
    };
  }
});

// Add route-level skip for health and docs
server.addHook('preHandler', (req, reply, done) => {
  if (req.url === '/health' || req.url.startsWith('/docs/')) {
    // Skip rate limiting for these routes
    return done();
  }
  done();
});

// Validate required environment variables
required("AUTH0_DOMAIN");
required("AUTH0_AUDIENCE");

// Register route plugins
await server.register(import('./routes/drc.js'));

server.get("/v1/me", { preHandler: [authGuard], config: { rateLimit: {} } }, async (req) => ({
  sub: req.user?.sub ?? "dev-user",
  roles: req.user?.roles ?? []
}));

// simple reverse-proxy style handoff (local dev): /drc/* -> http://drc:8000/*
server.get("/drc/health", { config: { rateLimit: {} } }, async (_req, reply) => {
  try {
    const r = await fetch("http://drc:8000/health");
    return reply.send(await r.json());
  } catch {
    return reply.code(502).send({ error: "drc_unreachable" });
  }
});

// Health check (liveness probe)
server.get("/health", async () => ({
  status: "ok",
  service: "api-gateway",
  time: new Date().toISOString(),
  version: process.env.GIT_SHA || "dev"
}));

// Readiness check (readiness probe)
server.get("/ready", async (req, reply) => {
  reply.header('cache-control', 'no-store');

  // Check cache first
  const now = Date.now();
  if (readinessCache && (now - readinessCache.timestamp) < READINESS_CACHE_MS) {
    return readinessCache.data;
  }

  // Run readiness checks with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), READINESS_TIMEOUT_MS);

    const checkPromise = runReadinessChecks();
    const result = await Promise.race([
      checkPromise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('Readiness check timeout'));
        });
      })
    ]);

    clearTimeout(timeoutId);

    // Cache the result
    readinessCache = { data: result, timestamp: now };

    return result;
  } catch (error) {
    // On timeout or error, return fail status
    const failResult = {
      status: 'fail' as const,
      checks: [{
        name: 'timeout',
        status: 'fail' as const,
        latency_ms: READINESS_TIMEOUT_MS,
        error: error instanceof Error ? error.message : 'Readiness check failed'
      }]
    };

    // Cache the fail result briefly
    readinessCache = { data: failResult, timestamp: now };

    return failResult;
  }
});

const port = Number(process.env.PORT ?? 8080);
server.listen({ host: "0.0.0.0", port });
