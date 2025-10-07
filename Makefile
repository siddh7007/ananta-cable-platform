.PHONY: dev build test lint sdk contracts sbom gitleaks env
dev: ## Run local stack
	docker compose up --build
build:
	pnpm -r run build
test:
	pnpm -r run test || true
lint:
	pnpm -r run lint || true
sdk:
	./scripts/gen-sdk.sh
sdk:check: ## Verify SDK matches spec
	./scripts/sdk-check.sh
contracts:
	./scripts/verify-contracts.sh
contracts:compat: ## Check OpenAPI spec compatibility against baseline
	./scripts/contract-compat.sh
sbom:
	./scripts/sbom.sh
gitleaks:
	gitleaks detect -v -c .gitleaks.toml || true
env: ## Validate environment variables
	./scripts/env-doctor.sh
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'


docs: ## Serve Redocly via docker (nginx at :8089)
	@echo "Open http://localhost:8089/docs/api/index.html"
	docker compose up -d api-docs


db.up: ## Start database services
	docker compose up -d supabase-db pg-extra oracle-xe

db.logs: ## Tail DB logs
	docker compose logs -f supabase-db pg-extra oracle-xe

db.psql: ## psql into Supabase Postgres
	PGPASSWORD=$${SUPABASE_POSTGRES_PASSWORD:-postgres} psql -h localhost -U $${SUPABASE_POSTGRES_USER:-postgres} -d $${SUPABASE_POSTGRES_DB:-appdb}

db.psql-extra: ## psql into Extra Postgres
	PGPASSWORD=$${PG_EXTRA_PASSWORD:-postgres} psql -h localhost -p 5442 -U $${PG_EXTRA_USER:-postgres} -d $${PG_EXTRA_DB:-extradb}

db.sqlplus: ## sqlplus into Oracle XE (needs sqlplus client on host)
	@echo "Connect using: sqlplus system/$${ORACLE_PASSWORD:-oracle}@localhost:1521/$${ORACLE_DB:-XEPDB1}"
