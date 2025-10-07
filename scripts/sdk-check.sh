#!/bin/bash
# SDK drift guard: regenerate client and check for mismatches

echo "Regenerating SDK from shared/contracts/openapi/v1/platform.v1.yaml..."
./scripts/gen-sdk.sh

echo "Checking for SDK drift..."
if git diff --exit-code --quiet -- shared/libs/client-sdk; then
  echo "✅ SDK is up to date"
  exit 0
else
  echo "❌ SDK out of date. Run scripts/gen-sdk.sh and commit changes."
  exit 1
fi