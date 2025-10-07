#!/bin/bash
# Test script for health and readiness probes
# Run this from the services/api-gateway directory

API_URL="http://localhost:8080"

echo "=== Health and Readiness Probe Tests ==="
echo

echo "Testing /health endpoint:"
echo "curl -s $API_URL/health | jq ."
curl -s "$API_URL/health" | jq . 2>/dev/null || curl -s "$API_URL/health"
echo
echo

echo "Testing /ready endpoint:"
echo "curl -s $API_URL/ready | jq ."
curl -s "$API_URL/ready" | jq . 2>/dev/null || curl -s "$API_URL/ready"
echo
echo

echo "=== Expected Responses ==="
echo
echo "/health should return:"
echo '{'
echo '  "status": "ok",'
echo '  "service": "api-gateway",'
echo '  "time": "2025-10-07T...",'
echo '  "version": "dev"'
echo '}'
echo
echo "/ready should return:"
echo '{'
echo '  "status": "ok|degraded|fail",'
echo '  "checks": ['
echo '    {"name":"drc","status":"ok|fail","latency_ms":123},'
echo '    {"name":"postgres_supabase","status":"ok|fail|skipped","latency_ms":456},'
echo '    {"name":"postgres_extra","status":"ok|fail|skipped","latency_ms":789},'
echo '    {"name":"oracle","status":"ok|fail|skipped","latency_ms":0}'
echo '  ]'
echo '}'
echo
echo "Note: Status will be 'ok' if all active checks pass,"
echo "'degraded' if any optional checks fail, 'fail' only on timeout."