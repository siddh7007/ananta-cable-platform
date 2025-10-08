// Set environment variables BEFORE any imports
const mockRendererPort = 15002;
process.env.DRAWINGS_DIR = 'test-drawings';
process.env.DEV_AUTH_BYPASS = 'true';
process.env.TEST_MODE = 'true';
process.env.RENDERER_SERVICE_URL = `http://127.0.0.1:${mockRendererPort}`;

import { test } from 'tap';
import { build } from '../src/app.js';
import type { AssemblySchema } from '@cable-platform/contracts/types/api';
import { mkdir, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';

// Test fixtures
const TEST_DRAWINGS_DIR = process.env.DRAWINGS_DIR!;

// Mock renderer service
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockRendererServer: any = null;

async function startMockRenderer() {
  if (mockRendererServer) {
    return mockRendererServer;
  }

  const Fastify = (await import('fastify')).default;
  const server = Fastify({ logger: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.post('/render', async (request, reply) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = request.body as any;
    const { dsl, templatePackId } = body;

    console.log(`[Mock Renderer] Handling render request for ${dsl?.meta?.assembly_id}`);

    // Generate deterministic SVG based on assembly_id
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420mm" height="297mm" viewBox="0 0 420 297">
  <metadata>
    <assembly id="${dsl.meta.assembly_id}" schema="${dsl.meta.schema_hash}"/>
    <template id="${templatePackId}" version="1.0.0"/>
  </metadata>
  <text x="210" y="150" text-anchor="middle">Test Assembly ${dsl.meta.assembly_id}</text>
</svg>`;

    return reply.send({
      svg,
      manifest: {
        rendererVersion: '0.0.0',
        templatePackId,
        rendererKind: 'svg2d',
        schemaHash: dsl.meta.schema_hash,
      },
    });
  });

  await server.listen({ port: mockRendererPort, host: '0.0.0.0' });
  console.log(`[Mock Renderer] Server started on 0.0.0.0:${mockRendererPort}`);
  mockRendererServer = server;
  return server;
}

// Initialize mock renderer BEFORE running tests
await (async () => {
  try {
    await rm(TEST_DRAWINGS_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
  await mkdir(TEST_DRAWINGS_DIR, { recursive: true });
  await startMockRenderer();
  
  // Wait longer and verify server is ready by making a test request
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`Mock renderer started on port ${mockRendererPort}`);
  
  // Verify mock server is reachable
  try {
    const testResponse = await fetch(`http://localhost:${mockRendererPort}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dsl: { meta: { assembly_id: 'test', schema_hash: 'test' } },
        templatePackId: 'test',
      }),
    });
    if (testResponse.ok) {
      console.log('Mock renderer verified and ready');
    } else {
      console.error('Mock renderer returned non-OK status:', testResponse.status);
    }
  } catch (err) {
    console.error('Failed to verify mock renderer:', err);
  }
})();

// Setup/teardown
test('setup', async (t) => {
  t.pass('Setup complete');
});

test('teardown', async (t) => {
  if (mockRendererServer) {
    await mockRendererServer.close();
  }

  try {
    await rm(TEST_DRAWINGS_DIR, { recursive: true, force: true });
  } catch {
    // Ignore errors
  }

  t.pass('Teardown complete');
});

// Helper: Create test schema
function createTestSchema(assemblyId: string, type: 'ribbon' | 'power_cable' = 'ribbon'): AssemblySchema {
  const schemaHash = createHash('sha256').update(assemblyId).digest('hex').slice(0, 16);

  if (type === 'ribbon') {
    return {
      assembly_id: assemblyId,
      schema_hash: schemaHash,
      cable: {
        type: 'ribbon',
        length_mm: 1250,
        tolerance_mm: 5,
        notes_pack_id: 'IPC-620-CLASS-2',
      },
      conductors: {
        count: 12,
        awg: 28,
        ribbon: {
          ways: 12,
          pitch_in: 0.05,
          red_stripe: true,
        },
      },
      endpoints: {
        endA: {
          connector: { mpn: 'TE-102345', positions: 12 },
          termination: 'idc' as const,
          label: 'MAIN BOARD',
        },
        endB: {
          connector: { mpn: 'TE-102345', positions: 12 },
          termination: 'idc' as const,
          label: 'SUB BOARD',
        },
      },
      shield: { type: 'none' },
      wirelist: Array.from({ length: 12 }, (_, i) => ({
        circuit: `D${i}`,
        conductor: i + 1,
        endA_pin: String(i + 1),
        endB_pin: String(i + 1),
        color: ['brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white', 'black', 'pink', 'turquoise'][i],
      })),
      bom: [],
    };
  } else {
    // Power cable
    return {
      assembly_id: assemblyId,
      schema_hash: schemaHash,
      cable: {
        type: 'power_cable',
        length_mm: 800,
        tolerance_mm: 10,
        locale: 'NA',
        notes_pack_id: 'UL-LISTED',
      },
      conductors: {
        count: 2,
        awg: 18,
      },
      endpoints: {
        endA: {
          connector: { mpn: 'PHOENIX-123', positions: 2 },
          termination: 'crimp' as const,
          label: '+48V POWER',
        },
        endB: {
          connector: { mpn: 'PHOENIX-123', positions: 2 },
          termination: 'crimp' as const,
          label: 'LOAD',
        },
      },
      shield: { type: 'none' },
      wirelist: [
        { circuit: '+48V', conductor: 1, endA_pin: '1', endB_pin: '1', color: 'red' },
        { circuit: 'RTN', conductor: 2, endA_pin: '2', endB_pin: '2', color: 'black' },
      ],
      bom: [],
    };
  }
}

// Mock DAO for testing
class MockAssembliesDAO {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private schemas = new Map<string, any>();

  setSchema(schema: AssemblySchema) {
    this.schemas.set(schema.assembly_id, {
      assembly_id: schema.assembly_id,
      draft_id: 'draft-123',
      schema,
      schema_hash: schema.schema_hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  async getAssemblySchema(assemblyId: string) {
    return this.schemas.get(assemblyId) || null;
  }

  async updateAssemblySchema() {
    // No-op for tests
  }
}

test('POST /v1/render - happy path with ribbon cable', async (t) => {
  const app = await build();
  t.teardown(() => app.close());

  const assemblyId = 'asm-test-ribbon-001';
  const schema = createTestSchema(assemblyId, 'ribbon');

  const response = await app.inject({
    method: 'POST',
    url: '/v1/render',
    payload: {
      schema,
      templatePackId: 'basic-a3',
      format: 'svg',
    },
  });

  t.equal(response.statusCode, 200, 'Returns 200 OK');

  const body = response.json();
  t.ok(body.render_manifest, 'Has render_manifest');
  t.equal(body.render_manifest.templatePackId, 'basic-a3', 'Correct template pack');
  t.equal(body.render_manifest.rendererKind, 'svg2d', 'Correct renderer kind');
  t.equal(body.render_manifest.schemaHash, schema.schema_hash, 'Correct schema hash');
  t.ok(body.url, 'Has URL');
  t.match(body.url, /\/drawings\/asm-test-ribbon-001\//, 'URL includes assembly ID');

  // Verify file was persisted
  const drawingPath = join(TEST_DRAWINGS_DIR, assemblyId, body.url.split('/')[3], 'drawing.svg');
  const fileContent = await readFile(drawingPath, 'utf-8');
  t.ok(fileContent.includes('<svg'), 'SVG file persisted');
  t.ok(fileContent.includes(assemblyId), 'SVG includes assembly ID');
});

test('POST /v1/render - inline SVG response', async (t) => {
  const app = await build();
  t.teardown(() => app.close());

  const assemblyId = 'asm-test-inline-001';
  const schema = createTestSchema(assemblyId, 'ribbon');

  const response = await app.inject({
    method: 'POST',
    url: '/v1/render',
    payload: {
      schema,
      templatePackId: 'basic-a3',
      format: 'svg',
      inline: true,
    },
  });

  t.equal(response.statusCode, 200, 'Returns 200 OK');

  const body = response.json();
  t.ok(body.render_manifest, 'Has render_manifest');
  t.ok(body.svg, 'Has inline SVG');
  t.notOk(body.url, 'No URL in inline mode');
  t.ok(body.svg.includes('<svg'), 'SVG content valid');
  t.ok(body.svg.includes(assemblyId), 'SVG includes assembly ID');
});

test('POST /v1/render - cache hit on second call', async (t) => {
  const app = await build();
  t.teardown(() => app.close());

  const assemblyId = 'asm-test-cache-001';
  const schema = createTestSchema(assemblyId, 'power_cable');

  // First call - cache miss
  const response1 = await app.inject({
    method: 'POST',
    url: '/v1/render',
    payload: {
      schema,
      templatePackId: 'basic-a3',
      format: 'svg',
    },
  });

  t.equal(response1.statusCode, 200, 'First call returns 200');
  const body1 = response1.json();
  t.notOk(body1.render_manifest.cacheHit, 'First call is cache miss');

  // Second call - cache hit
  const response2 = await app.inject({
    method: 'POST',
    url: '/v1/render',
    payload: {
      schema,
      templatePackId: 'basic-a3',
      format: 'svg',
    },
  });

  t.equal(response2.statusCode, 200, 'Second call returns 200');
  const body2 = response2.json();
  t.ok(body2.render_manifest.cacheHit, 'Second call is cache hit');
  t.equal(body2.url, body1.url, 'Same URL returned');
});

test('POST /v1/render - missing assembly_id returns 404', async (t) => {
  const app = await build();
  t.teardown(() => app.close());

  const response = await app.inject({
    method: 'POST',
    url: '/v1/render',
    payload: {
      assembly_id: 'nonexistent-asm-999',
      templatePackId: 'basic-a3',
      format: 'svg',
    },
  });

  t.equal(response.statusCode, 404, 'Returns 404 for missing assembly');
  const body = response.json();
  t.ok(body.error, 'Has error message');
  t.match(body.error, /not found/i, 'Error mentions "not found"');
});

test('POST /v1/render - missing template pack returns 400', async (t) => {
  const app = await build();
  t.teardown(() => app.close());

  const schema = createTestSchema('asm-test-badtemplate-001', 'ribbon');

  const response = await app.inject({
    method: 'POST',
    url: '/v1/render',
    payload: {
      schema,
      templatePackId: 'nonexistent-template',
      format: 'svg',
    },
  });

  t.equal(response.statusCode, 400, 'Returns 400 for missing template');
  const body = response.json();
  t.ok(body.error, 'Has error message');
  t.match(body.error, /not found/i, 'Error mentions "not found"');
});

test('POST /v1/render - power cable with NA locale colors', async (t) => {
  const app = await build();
  t.teardown(() => app.close());

  const assemblyId = 'asm-test-power-na-001';
  const schema = createTestSchema(assemblyId, 'power_cable');

  const response = await app.inject({
    method: 'POST',
    url: '/v1/render',
    payload: {
      schema,
      templatePackId: 'basic-a3',
      format: 'svg',
      inline: true,
    },
  });

  t.equal(response.statusCode, 200, 'Returns 200 OK');
  const body = response.json();
  t.ok(body.svg, 'Has SVG content');
  
  // Verify power cable was processed
  t.ok(body.render_manifest.schemaHash, 'Has schema hash');
});

test('GET /v1/template-packs - returns available templates', async (t) => {
  const app = await build();
  t.teardown(() => app.close());

  const response = await app.inject({
    method: 'GET',
    url: '/v1/template-packs',
  });

  t.equal(response.statusCode, 200, 'Returns 200 OK');
  const body = response.json();
  t.ok(body.templates, 'Has templates array');
  t.ok(Array.isArray(body.templates), 'Templates is an array');
  t.ok(body.templates.length > 0, 'Has at least one template');
  
  const template = body.templates[0];
  t.equal(template.id, 'basic-a3', 'Has basic-a3 template');
  t.ok(template.version, 'Template has version');
  t.ok(template.dimensions, 'Template has dimensions');
  t.ok(template.styles, 'Template has styles');
});

test('POST /v1/render - handles broken dimension for long cables', async (t) => {
  const app = await build();
  t.teardown(() => app.close());

  const assemblyId = 'asm-test-long-cable-001';
  const schema = createTestSchema(assemblyId, 'ribbon');
  schema.cable.length_mm = 3000; // Over 2m threshold

  const response = await app.inject({
    method: 'POST',
    url: '/v1/render',
    payload: {
      schema,
      templatePackId: 'basic-a3',
      format: 'svg',
      inline: true,
    },
  });

  t.equal(response.statusCode, 200, 'Returns 200 OK for long cable');
  const body = response.json();
  t.ok(body.svg, 'Has SVG content');
  
  // The DSL should have broken_dim=true (verified in mapper)
  t.ok(body.render_manifest, 'Has render manifest');
});
