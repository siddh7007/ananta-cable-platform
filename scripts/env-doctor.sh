#!/usr/bin/env bash
set -euo pipefail

# Load environment variables from .env.local if it exists
if [ -f ".env.local" ]; then
  echo "📂 Loading environment from .env.local"
  set -a
  source .env.local
  set +a
elif [ -f ".env" ]; then
  echo "📂 Loading environment from .env"
  set -a
  source .env
  set +a
else
  echo "⚠️  No .env or .env.local file found. Using system environment only."
fi

require() {
  local n="$1"
  if [ -z "${!n:-}" ]; then
    echo "❌ Missing env: $n"
    exit 1
  else
    echo "✅ $n=${!n}"
  fi
}

warn_if_missing() {
  local n="$1"
  if [ -z "${!n:-}" ]; then
    echo "⚠️  Optional env missing: $n"
  else
    echo "✅ $n=${!n}"
  fi
}

echo ""
echo "🔍 Env Doctor - Validating environment variables"
echo "=================================================="

echo ""
echo "📋 Auth0 Configuration:"
require AUTH0_DOMAIN
require AUTH0_AUDIENCE

echo ""
echo "🔧 Development Settings:"
warn_if_missing DEV_AUTH_BYPASS

echo ""
echo "🌐 API Configuration:"
warn_if_missing VITE_API_BASE_URL

echo ""
echo "🗄️  Supabase Postgres (Local):"
warn_if_missing SUPABASE_POSTGRES_USER
warn_if_missing SUPABASE_POSTGRES_PASSWORD
warn_if_missing SUPABASE_POSTGRES_DB
warn_if_missing SUPABASE_DATABASE_URL

echo ""
echo "🗄️  Extra Postgres (Utility):"
warn_if_missing PG_EXTRA_USER
warn_if_missing PG_EXTRA_PASSWORD
warn_if_missing PG_EXTRA_DB
warn_if_missing PG_EXTRA_DATABASE_URL

echo ""
echo "🗄️  Oracle XE (Local):"
warn_if_missing ORACLE_PASSWORD
warn_if_missing ORACLE_DB
warn_if_missing ORACLE_APP_USER
warn_if_missing ORACLE_APP_PASSWORD
warn_if_missing ORACLE_CONNECT_STRING

echo ""
echo "📊 Observability:"
warn_if_missing OTEL_EXPORTER_OTLP_ENDPOINT

echo ""
echo "💡 Tips:"
echo "   - Use .env for shared defaults and .env.local for developer overrides"
echo "   - Copy .env to .env.local and fill in your values"
echo "   - Never commit .env.local to version control"

echo ""
echo "✅ Environment validation complete!"
