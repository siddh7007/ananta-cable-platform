import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parse } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('OpenAPI Spec Loading', () => {
  it('should load and parse platform.v1.yaml', () => {
    const specPath = join(__dirname, '../../../shared/contracts/openapi/v1/platform.v1.yaml');
    const specContent = readFileSync(specPath, 'utf8');
    const spec = parse(specContent) as Record<string, unknown>;

    expect(spec).toBeDefined();
    expect(spec.openapi).toBeDefined();
    expect(spec.info).toBeDefined();
    expect(spec.paths).toBeDefined();
  });

  it('should contain required paths', () => {
    const specPath = join(__dirname, '../../../shared/contracts/openapi/v1/platform.v1.yaml');
    const specContent = readFileSync(specPath, 'utf8');
    const spec = parse(specContent) as Record<string, unknown>;

    const requiredPaths = [
      '/health',
      '/v1/me',
      '/v1/drc/run'
    ];

    const paths = spec.paths as Record<string, unknown>;
    for (const path of requiredPaths) {
      expect(paths).toHaveProperty(path);
    }
  });

  it('should have correct HTTP methods for required paths', () => {
    const specPath = join(__dirname, '../../../shared/contracts/openapi/v1/platform.v1.yaml');
    const specContent = readFileSync(specPath, 'utf8');
    const spec = parse(specContent) as Record<string, unknown>;

    const paths = spec.paths as Record<string, unknown>;
    const healthPath = paths['/health'] as Record<string, unknown>;
    const mePath = paths['/v1/me'] as Record<string, unknown>;
    const drcPath = paths['/v1/drc/run'] as Record<string, unknown>;

    expect(healthPath).toHaveProperty('get');
    expect(mePath).toHaveProperty('get');
    expect(drcPath).toHaveProperty('post');
  });
});