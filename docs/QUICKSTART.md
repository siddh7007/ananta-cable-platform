# Cable Platform Quickstart

Spin up the full stack locally with Docker and explore the major entry points.

## Prerequisites

- **Docker Desktop 4.30+** (or Docker Engine with Compose v2)
- **Node.js 20+** (optional, only needed for local CLI helpers)
- **pnpm 9** (`corepack enable && corepack prepare pnpm@9 --activate`)
- Recommended: copy `.env.example` to `.env.local` and adjust secrets

## Start the stack

```bash
# install JS packages (optional but recommended for tooling)
pnpm install

# bring up services
docker compose up --build
```

The compose stack rebuilds the Fastify API gateway, Svelte portal, BFF, and the
Python DRC service before exposing everything on localhost.

## Key service URLs

| Service | URL | Notes |
| --- | --- | --- |
| Portal UI | http://localhost:5173 | Svelte front-end served by `apps/portal` |
| API Gateway | http://localhost:8080 | Fastify gateway, includes `/health` |
| BFF Portal | http://localhost:8081 | Node bridge that proxies to DRC/render services |
| DRC Service | http://localhost:8000/docs | FastAPI swagger for validation endpoints |
| API Docs | http://localhost:8089/docs | Static OpenAPI & reference documentation |
| Supabase Postgres | localhost:5432 | Default `postgres/postgres` credentials |
| Extra Postgres | localhost:5442 | Additional rule-table database |
| Oracle XE | localhost:1521 | Optional Oracle sandbox (XE) |

Use `docker compose ps` to confirm readiness; each service has a health check so
the portal waits for upstream dependencies before becoming ready.

## Request flow diagram

```
                 ┌────────────────────┐
                 │   Portal Client    │
                 └────────┬───────────┘
                          │ fetch /v1/**
                          ▼
┌────────────────────┐  REST  ┌────────────────────┐  SQL / gRPC  ┌────────────────────────────┐
│   API Gateway      │<──────>│    DRC Service     │<────────────>│  Databases (Postgres/Oracle)│
└────────────────────┘        └────────────────────┘              └────────────────────────────┘
```

For analytics, the gateway emits OTEL spans (disabled by default) following the
same path shown above.
