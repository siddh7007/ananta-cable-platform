import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parse } from 'yaml';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../src/index.js';
import { getAjv } from '@cable-platform/validation';
import type { DRCReport } from '@cable-platform/contracts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Response Schema Validation', () => {
  let app: FastifyInstance;
  let ajv: ReturnType<typeof getAjv>;
  let spec: Record<string, unknown>;

  beforeAll(async () => {
    app = await buildServer();
    ajv = getAjv();

    // Load OpenAPI spec
    const specPath = join(__dirname, '../../../shared/contracts/openapi/v1/platform.v1.yaml');
    const specContent = readFileSync(specPath, 'utf8');
    spec = parse(specContent) as Record<string, unknown>;
  });

  describe('GET /ready', () => {
    let responseSchema: Record<string, unknown> | undefined;

    beforeAll(() => {
      // Extract response schema from OpenAPI spec
      const paths = spec.paths as Record<string, unknown>;
      const readyPath = paths['/ready'] as Record<string, unknown>;
      const readyGet = readyPath?.get as Record<string, unknown>;
      const responses = readyGet?.responses as Record<string, unknown>;
      const successResponse = responses?.['200'] as Record<string, unknown>;
      const content = successResponse?.content as Record<string, unknown>;
      const jsonContent = content?.['application/json'] as Record<string, unknown>;
      responseSchema = jsonContent?.schema as Record<string, unknown>;
    });

    it('should validate response against OpenAPI schema', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/ready'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);

      const body = JSON.parse(response.payload);

      // Validate against OpenAPI schema if available
      if (responseSchema) {
        const validate = ajv.compile(responseSchema);
        const isValid = validate(body);
        expect(isValid).toBe(true);
        if (!isValid) {
          console.error('Schema validation errors:', validate.errors);
        }
      }

      // Validate structure matches expected readiness response
      expect(body).toHaveProperty('status');
      expect(['pass', 'fail']).toContain(body.status);
      expect(body).toHaveProperty('checks');
      expect(Array.isArray(body.checks)).toBe(true);
    });
  });

  describe('POST /v1/drc/run', () => {
    let responseSchema: Record<string, unknown> | undefined;
    let requestSchema: Record<string, unknown> | undefined;

    beforeAll(() => {
      // Extract response and request schemas from OpenAPI spec
      const paths = spec.paths as Record<string, unknown>;
      const drcPath = paths['/v1/drc/run'] as Record<string, unknown>;
      const drcPost = drcPath?.post as Record<string, unknown>;

      // Response schema
      const responses = drcPost?.responses as Record<string, unknown>;
      const successResponse = responses?.['200'] as Record<string, unknown>;
      const content = successResponse?.content as Record<string, unknown>;
      const jsonContent = content?.['application/json'] as Record<string, unknown>;
      responseSchema = jsonContent?.schema as Record<string, unknown>;

      // Request schema
      const requestBody = drcPost?.requestBody as Record<string, unknown>;
      const reqContent = requestBody?.content as Record<string, unknown>;
      const reqJsonContent = reqContent?.['application/json'] as Record<string, unknown>;
      requestSchema = reqJsonContent?.schema as Record<string, unknown>;
    });

    it('should validate request and response against OpenAPI schemas', async () => {
      // Increase timeout for DRC operations which can be slow
      // Load sample design fixture
      const sampleDesignPath = join(__dirname, '../../../shared/testing/fixtures/sample-design.json');
      const sampleDesign = JSON.parse(readFileSync(sampleDesignPath, 'utf8'));

      // Validate request against schema if available
      if (requestSchema) {
        const validateRequest = ajv.compile(requestSchema);
        const isRequestValid = validateRequest(sampleDesign);
        expect(isRequestValid).toBe(true);
        if (!isRequestValid) {
          console.error('Request schema validation errors:', validateRequest.errors);
        }
      }

      const response = await app.inject({
        method: 'POST',
        url: '/v1/drc/run',
        payload: sampleDesign,
        headers: {
          'content-type': 'application/json'
        }
      });

      // DRC service may not be available in test environment, so we accept both success and error responses
      expect([200, 500]).toContain(response.statusCode);
      expect(response.headers['content-type']).toMatch(/application\/json/);

      const body = JSON.parse(response.payload);

      // Validate against OpenAPI schema if available and response is successful
      if (responseSchema && response.statusCode === 200) {
        const validateResponse = ajv.compile(responseSchema);
        const isResponseValid = validateResponse(body);
        expect(isResponseValid).toBe(true);
        if (!isResponseValid) {
          console.error('Response schema validation errors:', validateResponse.errors);
        }

        // Additional validation using generated types
        const drcResult = body as DRCReport;
        expect(typeof drcResult.assembly_id).toBe('string');
        expect(typeof drcResult.ruleset_id).toBe('string');
        expect(typeof drcResult.version).toBe('string');
        expect(typeof drcResult.passed).toBe('boolean');
        expect(typeof drcResult.errors).toBe('number');
        expect(typeof drcResult.warnings).toBe('number');
        expect(Array.isArray(drcResult.findings)).toBe(true);
        expect(Array.isArray(drcResult.fixes)).toBe(true);
        expect(typeof drcResult.generated_at).toBe('string');
      } else if (response.statusCode === 500) {
        // Validate error response structure
        expect(body).toHaveProperty('error', 'upstream_unavailable');
      }
    }, 30000);
  });

  describe('Schema Compilation', () => {
    it('should successfully compile all response schemas from OpenAPI spec', () => {
      const paths = spec.paths as Record<string, unknown>;

      // Test /ready endpoint schema
      const readyPath = paths['/ready'] as Record<string, unknown>;
      if (readyPath?.get) {
        const readyGet = readyPath.get as Record<string, unknown>;
        const responses = readyGet.responses as Record<string, unknown>;
        const successResponse = responses?.['200'] as Record<string, unknown>;
        const content = successResponse?.content as Record<string, unknown>;
        const jsonContent = content?.['application/json'] as Record<string, unknown>;
        if (jsonContent?.schema) {
          expect(() => ajv.compile(jsonContent.schema as Record<string, unknown>)).not.toThrow();
        }
      }

      // Test /v1/drc/run endpoint schemas
      const drcPath = paths['/v1/drc/run'] as Record<string, unknown>;
      if (drcPath?.post) {
        const drcPost = drcPath.post as Record<string, unknown>;

        // Request schema
        const requestBody = drcPost.requestBody as Record<string, unknown>;
        const reqContent = requestBody?.content as Record<string, unknown>;
        const reqJsonContent = reqContent?.['application/json'] as Record<string, unknown>;
        if (reqJsonContent?.schema) {
          expect(() => ajv.compile(reqJsonContent.schema as Record<string, unknown>)).not.toThrow();
        }

        // Response schema
        const responses = drcPost.responses as Record<string, unknown>;
        const successResponse = responses?.['200'] as Record<string, unknown>;
        const content = successResponse?.content as Record<string, unknown>;
        const jsonContent = content?.['application/json'] as Record<string, unknown>;
        if (jsonContent?.schema) {
          expect(() => ajv.compile(jsonContent.schema as Record<string, unknown>)).not.toThrow();
        }
      }
    });
  });
});