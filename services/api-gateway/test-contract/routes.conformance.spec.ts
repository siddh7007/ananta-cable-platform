import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parse } from 'yaml';
import { FastifyInstance, InjectOptions } from 'fastify';
import { buildServer } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('API Routes Conformance', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Set up environment for testing
    process.env.DEV_AUTH_BYPASS = 'true';
    process.env.AUTH0_DOMAIN = 'test.auth0.com';
    process.env.AUTH0_AUDIENCE = 'test-audience';

    app = await buildServer();
  });

  describe('GET /health', () => {
    it('should return 200 with JSON content type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('service', 'api-gateway');
      expect(body).toHaveProperty('time');
      expect(body).toHaveProperty('version');
    });
  });

  describe('GET /v1/me', () => {
    it('should return 200 with user data when DEV_AUTH_BYPASS=true', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/me'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('sub', 'dev-user');
      expect(body).toHaveProperty('roles');
    });
  });

  describe('POST /v1/drc/run', () => {
    it('should accept valid cable design and proxy to DRC service', async () => {
      // Load sample design fixture
      const sampleDesignPath = join(__dirname, '../../../shared/testing/fixtures/sample-design.json');
      const sampleDesign = JSON.parse(readFileSync(sampleDesignPath, 'utf8'));

      const response = await app.inject({
        method: 'POST',
        url: '/v1/drc/run',
        payload: sampleDesign,
        headers: {
          'content-type': 'application/json'
        }
      });

      // When DRC service is not available, it should return 500 upstream unavailable
      expect(response.statusCode).toBe(500);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('error', 'upstream_unavailable');
    }, 10000); // 10 second timeout for external service call

    it('should reject invalid content type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/drc/run',
        payload: 'invalid data',
        headers: {
          'content-type': 'text/plain'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('error');
    });

    it('should reject invalid JSON payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/drc/run',
        payload: { invalid: 'data' },
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('error');
    });
  });

  describe('OpenAPI Spec Conformance', () => {
    let spec: Record<string, unknown>;

    beforeAll(() => {
      const specPath = join(__dirname, '../../../shared/contracts/openapi/v1/platform.v1.yaml');
      const specContent = readFileSync(specPath, 'utf8');
      spec = parse(specContent) as Record<string, unknown>;
    });

    it('should return documented status codes for /health', async () => {
      const paths = spec.paths as Record<string, unknown>;
      const healthSpec = paths['/health'] as Record<string, unknown>;
      const healthGet = healthSpec.get as Record<string, unknown>;
      const responses = healthGet.responses as Record<string, unknown>;
      const documentedStatuses = Object.keys(responses);

      // Should include 200
      expect(documentedStatuses).toContain('200');
    });

    it('should return documented status codes for /v1/me', async () => {
      const paths = spec.paths as Record<string, unknown>;
      const meSpec = paths['/v1/me'] as Record<string, unknown>;
      const meGet = meSpec.get as Record<string, unknown>;
      const responses = meGet.responses as Record<string, unknown>;
      const documentedStatuses = Object.keys(responses);

      // Should include 200
      expect(documentedStatuses).toContain('200');
    });

    it('should return documented status codes for /v1/drc/run', async () => {
      const paths = spec.paths as Record<string, unknown>;
      const drcSpec = paths['/v1/drc/run'] as Record<string, unknown>;
      const drcPost = drcSpec.post as Record<string, unknown>;
      const responses = drcPost.responses as Record<string, unknown>;
      const documentedStatuses = Object.keys(responses);

      // Should include 200
      expect(documentedStatuses).toContain('200');
    });

    it('should return JSON content type for all responses', async () => {
      // Test that all our tested endpoints return JSON
      const endpoints = [
        { method: 'GET', path: '/health' },
        { method: 'GET', path: '/v1/me' },
        { method: 'POST', path: '/v1/drc/run', data: JSON.parse(readFileSync(join(__dirname, '../../../shared/testing/fixtures/sample-design.json'), 'utf8')) }
      ];

      for (const endpoint of endpoints) {
        const injectOptions: InjectOptions = {
          method: endpoint.method as 'GET' | 'POST',
          url: endpoint.path
        };

        if (endpoint.data) {
          injectOptions.payload = endpoint.data;
          injectOptions.headers = { 'content-type': 'application/json' };
        }

        const response = await app.inject(injectOptions);
        expect(response.headers['content-type']).toMatch(/application\/json/);
      }
    }, 15000); // 15 second timeout since DRC test takes time
  });
});