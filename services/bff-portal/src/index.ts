import Fastify from "fastify";
import cors from "@fastify/cors";
import { randomUUID } from "crypto";

async function startServer() {
  const server = Fastify({ logger: true });
  await server.register(cors, { origin: true });

  // Request ID handling
  server.addHook('onRequest', (req, _reply, done) => {
    const requestId = req.headers['x-request-id'] as string || randomUUID();
    req.id = requestId;
    done();
  });

  server.addHook('onSend', (req, reply, _payload, done) => {
    reply.header('x-request-id', req.id);
    done();
  });

  // Health endpoint
  server.get("/health", async () => ({
    status: "ok",
    service: "bff-portal",
    time: new Date().toISOString()
  }));

  // Me endpoint - protected unless DEV_AUTH_BYPASS=true
  server.get("/me", async (req, reply) => {
    const devBypass = (process.env.DEV_AUTH_BYPASS ?? "false") === "true";

    if (!devBypass) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    return {
      sub: "dev-user",
      roles: ["dev"],
      features: []
    };
  });

  // Config endpoint - public, safe client config
  server.get("/config", async () => {
    const nodeEnv = process.env.NODE_ENV || "development";
    const env = ["development", "staging", "production"].includes(nodeEnv) ? nodeEnv : "development";

    return {
      env,
      apiBaseUrl: process.env.VITE_API_BASE_URL || "http://localhost:8080",
      auth: {
        domain: process.env.AUTH0_DOMAIN || null,
        audience: process.env.AUTH0_AUDIENCE || null,
        devBypass: (process.env.DEV_AUTH_BYPASS ?? "false") === "true"
      },
      features: {
        otel: false,
        flags: []
      }
    };
  });

  const port = Number(process.env.PORT ?? 4001);
  server.listen({ host: "localhost", port });
}

startServer();
