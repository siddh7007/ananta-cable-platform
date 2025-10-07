#!/bin/bash
# Generate TypeScript client SDK from OpenAPI spec

npx openapi-typescript-codegen \
  --input shared/contracts/openapi/v1/platform.v1.yaml \
  --output shared/libs/client-sdk \
  --client axios
