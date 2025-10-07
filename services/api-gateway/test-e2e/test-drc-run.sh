#!/bin/bash
# Manual testing script for DRC run endpoint
# Run this from the services/api-gateway directory

API_URL="http://localhost:8080"
SAMPLE_DESIGN="../../../shared/testing/fixtures/sample-design.json"

echo "=== DRC Run Endpoint Manual Tests ==="
echo

# Test 1: Valid payload (requires valid JWT token)
echo "Test 1: Valid payload"
echo "Note: Replace YOUR_JWT_TOKEN with a valid token from Auth0"
echo "curl -X POST $API_URL/v1/drc/run \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -d @$SAMPLE_DESIGN"
echo
echo "Expected: 200 OK with DRC result containing design_id"
echo

# Test 2: Invalid payload (cores: 0)
echo "Test 2: Invalid payload (cores: 0)"
echo "curl -X POST $API_URL/v1/drc/run \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -d '{\"id\": \"test\", \"name\": \"Test\", \"cores\": 0}'"
echo
echo "Expected: 400 Bad Request with validation errors"
echo

# Test 3: Wrong content type
echo "Test 3: Wrong content type"
echo "curl -X POST $API_URL/v1/drc/run \\"
echo "  -H \"Content-Type: text/plain\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -d '{\"id\": \"test\", \"name\": \"Test\", \"cores\": 3}'"
echo
echo "Expected: 415 Unsupported Media Type"
echo

# Test 4: Missing authentication
echo "Test 4: Missing authentication"
echo "curl -X POST $API_URL/v1/drc/run \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d @$SAMPLE_DESIGN"
echo
echo "Expected: 401 Unauthorized"
echo

echo "=== To test upstream 5xx errors ==="
echo "Temporarily change the DRC service to return 500, then run Test 1"
echo "Expected: 502 Bad Gateway with upstream_unavailable error"