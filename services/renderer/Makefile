.PHONY: help dev build test lint clean

help:
	@echo "Renderer Service - Make targets:"
	@echo "  make dev     - Run in development mode"
	@echo "  make build   - Build TypeScript"
	@echo "  make test    - Run tests"
	@echo "  make lint    - Run linter"
	@echo "  make clean   - Clean build artifacts"

dev:
	pnpm run dev

build:
	pnpm run build

test:
	pnpm run test

lint:
	pnpm run lint

clean:
	rm -rf dist node_modules
