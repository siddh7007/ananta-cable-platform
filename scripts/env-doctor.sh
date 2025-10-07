#!/usr/bin/env bash
set -euo pipefail
require() { local n="$1"; if [ -z "${!n:-}" ]; then echo "❌ Missing env: $n"; exit 1; else echo "✅ $n=${!n}"; fi; }
echo "Env Doctor:"
require AUTH0_DOMAIN
require AUTH0_AUDIENCE
echo "Tip: Use .env for shared defaults and .env.local for developer overrides."
