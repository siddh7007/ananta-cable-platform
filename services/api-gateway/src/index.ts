import Fastify from "fastify";
import cors from "@fastify/cors";
import type { FastifyReply, FastifyRequest } from "fastify";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const server = Fastify({ logger: true });
await server.register(cors, { origin: true });

const DEV_BYPASS = (process.env.DEV_AUTH_BYPASS ?? "false") === "true";
const ISSUER = process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}/` : "";
const AUDIENCE = process.env.AUTH0_AUDIENCE || "";

const JWKS = ISSUER ? createRemoteJWKSet(new URL(`${ISSUER}.well-known/jwks.json`)) : null;

declare module "fastify" {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

async function authGuard(req: FastifyRequest, reply: FastifyReply) {
  if (DEV_BYPASS) return;
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) throw new Error("no token");
    const { payload } = await jwtVerify(token, JWKS!, { issuer: ISSUER, audience: AUDIENCE });
    req.user = payload;
  } catch {
    return reply.code(401).send({ error: "unauthorized" });
  }
}

server.get("/health", async () => ({ status: "ok", service: "api-gateway" }));
server.get("/v1/me", { preHandler: authGuard }, async (req) => ({ sub: req.user?.sub ?? "dev-user"}));

// simple reverse-proxy style handoff (local dev): /drc/* -> http://drc:8000/*
server.get("/drc/health", async (_req, reply) => {
  try {
    const r = await fetch("http://drc:8000/health");
    return reply.send(await r.json());
  } catch {
    return reply.code(502).send({ error: "drc_unreachable" });
  }
});

const port = Number(process.env.PORT ?? 8080);
server.listen({ host: "0.0.0.0", port });
