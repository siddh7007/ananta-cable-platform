import Fastify from "fastify";
import cors from "@fastify/cors";
const server = Fastify({ logger: true });
await server.register(cors, { origin: true });
server.get("/health", async () => ({ status: "ok", service: "bff-portal" }));
const port = Number(process.env.PORT ?? 4001);
server.listen({ host: "0.0.0.0", port });
