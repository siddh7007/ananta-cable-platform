.PHONY: help install dev build start test lint clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	pnpm install

dev: ## Start development server with hot reload
	pnpm run dev

build: ## Build the project
	pnpm run build

start: ## Start the MCP server
	pnpm run start

mcp: ## Start the Playwright MCP server directly
	pnpm run mcp

test: ## Run tests
	pnpm run test

lint: ## Run linting
	pnpm run lint

clean: ## Clean build artifacts
	rm -rf dist node_modules

.PHONY: install-browsers
install-browsers: ## Install Playwright browsers
	npx playwright install