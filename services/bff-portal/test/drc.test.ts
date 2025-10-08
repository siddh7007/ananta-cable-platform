import 'dotenv/config';

import Fastify from 'fastify';
import { test } from 'tap';
import { drcRoutes, type DrcRouteOptions } from '../src/routes/drc.ts';

type AssemblyRecord = {
  assembly_id: string;
  draft_id: string;
  schema: Record<string, unknown>;
  schema_hash: string;
  created_at: string;
  updated_at: string;
};

type AssembliesDaoLike = {
  getAssemblySchema(assemblyId: string): Promise<AssemblyRecord | null>;
  updateAssemblySchema(
    assemblyId: string,
    schema: Record<string, unknown>,
    schemaHash: string
  ): Promise<void>;
};

type DrcDaoLike = {
  upsertReport(report: any): Promise<void>;
  getReport(assemblyId: string): Promise<any | null>;
};

class AssembliesStub implements AssembliesDaoLike {
  private store = new Map<string, AssemblyRecord>();

  set(record: AssemblyRecord) {
    this.store.set(record.assembly_id, structuredClone(record));
  }

  async getAssemblySchema(assemblyId: string) {
    const record = this.store.get(assemblyId);
    return record ? structuredClone(record) : null;
  }

  async updateAssemblySchema(assemblyId: string, schema: Record<string, unknown>, schemaHash: string) {
    const existing = this.store.get(assemblyId);
    if (!existing) {
      throw new Error(`Assembly ${assemblyId} not found`);
    }

    existing.schema = structuredClone(schema);
    existing.schema_hash = schemaHash;
    existing.updated_at = new Date().toISOString();
  }

  snapshot(assemblyId: string) {
    const record = this.store.get(assemblyId);
    return record ? structuredClone(record) : undefined;
  }
}

class DrcReportsStub implements DrcDaoLike {
  private reports = new Map<string, any>();

  async upsertReport(report: any) {
    this.reports.set(report.assembly_id, structuredClone(report));
  }

  async getReport(assemblyId: string) {
    const report = this.reports.get(assemblyId);
    return report ? structuredClone(report) : null;
  }

  snapshot(assemblyId: string) {
    const report = this.reports.get(assemblyId);
    return report ? structuredClone(report) : undefined;
  }
}

type FetchHandler = (body: unknown) => { status?: number; body?: unknown };

class FetchStub {
  private queue: Array<{ path: string; method: string; handler: FetchHandler }> = [];

  reply(path: string, method: string, handler: FetchHandler | { status?: number; body?: unknown }) {
    const wrapped = typeof handler === 'function' ? handler : () => handler;
    this.queue.push({ path, method: method.toUpperCase(), handler: wrapped });
  }

  fetch: typeof fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? new URL(input) : new URL(input.toString());
    const method = (init.method ?? 'GET').toUpperCase();
    const match = this.queue.shift();
    if (!match) {
      throw new Error(`Unexpected fetch to ${url.pathname}`);
    }

    if (match.path !== url.pathname || match.method !== method) {
      throw new Error(`Expected ${match.method} ${match.path} but received ${method} ${url.pathname}`);
    }

    let parsedBody: unknown = undefined;
    if (init.body) {
      const text = typeof init.body === 'string' ? init.body : init.body.toString();
      parsedBody = text ? JSON.parse(text) : undefined;
    }

    const { status = 200, body = null } = match.handler(parsedBody);
    return {
      ok: status >= 200 && status < 300,
      status,
      async json() {
        return structuredClone(body);
      },
    } as Response;
  };

  ensureConsumed(t: test.Test) {
    t.equal(this.queue.length, 0, 'all fetch expectations should be consumed');
  }
}

const AUTH_HEADER = { authorization: 'Bearer unit-test-token' };

const BASE_SCHEMA = {
  cable: {
    type: 'sensor_lead',
    length_mm: 150,
    od_mm: 6,
    environment: { temp_min_c: -20, temp_max_c: 80, flex_class: 'static', chemicals: [] },
    electrical: { system_voltage_v: 48 },
    ratings: { voltage_v: 300, temp_c: 105 },
    emi: { shield: 'none', drain_policy: 'isolated' },
    locale: 'NA',
    compliance: { ipc_class: '2', ul94_v0_labels: true, rohs_reach: true },
  },
  conductors: { count: 4, awg: 24 },
  endpoints: {
    endA: {
      connector: { mpn: 'IDC-04A', positions: 4, pin1_indicator: true },
      termination: 'idc',
      contacts: { primary: { mpn: 'IDC-04A-CON', plating: 'gold-flash' } },
      accessories: [],
    },
    endB: {
      connector: { mpn: 'IDC-04B', positions: 4, pin1_indicator: true },
      termination: 'idc',
      contacts: { primary: { mpn: 'IDC-04B-CON', plating: 'gold-flash' } },
      accessories: [],
    },
  },
  shield: { type: 'none', drain_policy: 'isolated' },
  wirelist: [
    { circuit: 'SIG+', conductor: 1, color: 'RED' },
    { circuit: 'SIG-', conductor: 2, color: 'BLACK' },
  ],
  bom: [{ ref: { mpn: 'IDC-04A' }, qty: 1, role: 'primary' }],
};

function buildAssemblyRecord(assemblyId: string, schemaHash: string, labels: Record<string, unknown> | null): AssemblyRecord {
  return {
    assembly_id: assemblyId,
    draft_id: `draft-${assemblyId}`,
    schema: {
      ...BASE_SCHEMA,
      labels: labels === null ? undefined : labels ?? { offset_mm: 10 },
    },
    schema_hash: schemaHash,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function createApp(deps: DrcRouteOptions) {
  const app = Fastify({ logger: false });
  await app.register(drcRoutes, deps);
  return app;
}

test('DRC BFF integration', async (t) => {
  process.env.DEV_AUTH_BYPASS = 'true';
  process.env.DRC_SERVICE_URL = 'http://rules-service';

  t.test('POST /v1/drc/run stores report and returns payload', async (t) => {
    const assemblies = new AssembliesStub();
    const reports = new DrcReportsStub();
    const fetchStub = new FetchStub();

    const assemblyId = 'test-drc-run';
    assemblies.set(buildAssemblyRecord(assemblyId, 'hash-run', { offset_mm: 10 }));

    const drcReport = {
      assembly_id: assemblyId,
      ruleset_id: 'rs-001',
      version: '1.0.0',
      passed: false,
      errors: 0,
      warnings: 1,
      findings: [
        {
          id: 'LABEL_OFFSET_MISSING',
          severity: 'warning',
          domain: 'labeling',
          code: 'LABEL_OFFSET_MISSING',
          message: 'Label offset not specified; defaulting to 30mm from end.',
          where: 'labels.offset_mm',
        },
      ],
      fixes: [
        {
          id: 'FIX_LABEL_OFFSET_DEFAULT',
          label: 'Apply default label offset',
          description: 'Set label offset to default 30mm from connector datum.',
          applies_to: ['labels.offset_mm'],
          effect: 'non_destructive',
        },
      ],
      generated_at: new Date().toISOString(),
    };

    fetchStub.reply('/drc/run', 'POST', () => ({ body: drcReport }));

    const app = await createApp({ assembliesDao: assemblies, drcDao: reports, fetchImpl: fetchStub.fetch });
    t.teardown(() => app.close());

    const response = await app.inject({
      method: 'POST',
      url: '/v1/drc/run',
      headers: AUTH_HEADER,
      payload: { assembly_id: assemblyId },
    });

    t.equal(response.statusCode, 200);
    const payload = response.json();
    t.equal(payload.assembly_id, assemblyId);
    t.equal(payload.warnings, 1);
    fetchStub.ensureConsumed(t);

    const stored = reports.snapshot(assemblyId);
    t.ok(stored);
    t.equal(stored?.warnings, 1);
  });

  t.test('POST /v1/drc/apply-fixes updates schema and report', async (t) => {
    const assemblies = new AssembliesStub();
    const reports = new DrcReportsStub();
    const fetchStub = new FetchStub();

    const assemblyId = 'test-drc-apply';
    assemblies.set(buildAssemblyRecord(assemblyId, 'hash-apply', null));

    const runReport = {
      assembly_id: assemblyId,
      ruleset_id: 'rs-001',
      version: '1.0.0',
      passed: false,
      errors: 0,
      warnings: 1,
      findings: [
        {
          id: 'LABEL_OFFSET_MISSING',
          severity: 'warning',
          domain: 'labeling',
          code: 'LABEL_OFFSET_MISSING',
          message: 'Label offset not specified; defaulting to 30mm from end.',
          where: 'labels.offset_mm',
        },
      ],
      fixes: [
        {
          id: 'FIX_LABEL_OFFSET_DEFAULT',
          label: 'Apply default label offset',
          description: 'Set label offset to default 30mm from connector datum.',
          applies_to: ['labels.offset_mm'],
          effect: 'non_destructive',
        },
      ],
      generated_at: new Date().toISOString(),
    };

    fetchStub.reply('/drc/run', 'POST', () => ({ body: runReport }));

    const app = await createApp({ assembliesDao: assemblies, drcDao: reports, fetchImpl: fetchStub.fetch });
    t.teardown(() => app.close());

    await app.inject({
      method: 'POST',
      url: '/v1/drc/run',
      headers: AUTH_HEADER,
      payload: { assembly_id: assemblyId },
    });

    const applyResponse = {
      assembly_id: assemblyId,
      schema_hash: 'hash-apply-fixed',
      schema: {
        assembly_id: assemblyId,
        schema_hash: 'hash-apply-fixed',
        ...BASE_SCHEMA,
        labels: { offset_mm: 30 },
      },
      drc: {
        ...runReport,
        passed: true,
        warnings: 0,
        findings: [],
        fixes: [],
        generated_at: new Date().toISOString(),
      },
    };

    fetchStub.reply('/drc/apply-fixes', 'POST', () => ({ body: applyResponse }));

    const response = await app.inject({
      method: 'POST',
      url: '/v1/drc/apply-fixes',
      headers: AUTH_HEADER,
      payload: {
        assembly_id: assemblyId,
        fix_ids: ['FIX_LABEL_OFFSET_DEFAULT'],
      },
    });

    t.equal(response.statusCode, 200);
    const payload = response.json();
    t.equal(payload.schema_hash, 'hash-apply-fixed');
    t.equal(payload.drc.warnings, 0);
    fetchStub.ensureConsumed(t);

    const updatedAssembly = assemblies.snapshot(assemblyId);
    t.ok(updatedAssembly);
    t.same(updatedAssembly?.schema.labels, { offset_mm: 30 });
    t.equal(updatedAssembly?.schema_hash, 'hash-apply-fixed');

    const storedReport = reports.snapshot(assemblyId);
    t.ok(storedReport);
    t.equal(storedReport?.warnings, 0);
  });

  t.test('POST /v1/drc/apply-fixes fails when fix id not present', async (t) => {
    const assemblies = new AssembliesStub();
    const reports = new DrcReportsStub();
    const fetchStub = new FetchStub();

    const assemblyId = 'test-drc-missing-fix';
    assemblies.set(buildAssemblyRecord(assemblyId, 'hash-missing', { offset_mm: 25 }));

    await reports.upsertReport({
      assembly_id: assemblyId,
      ruleset_id: 'rs-001',
      version: '1.0.0',
      passed: false,
      errors: 1,
      warnings: 0,
      findings: [
        {
          id: 'CONSIST_STUD_SIZE_MISSING',
          severity: 'error',
          domain: 'consistency',
          code: 'CONSISTENCY/STUD_SIZE_MISSING',
          message: 'Ring lug termination requires stud size to be specified.',
          where: 'endB.lugs[*].stud',
        },
      ],
      fixes: [],
      generated_at: new Date().toISOString(),
    });

    const app = await createApp({ assembliesDao: assemblies, drcDao: reports, fetchImpl: fetchStub.fetch });
    t.teardown(() => app.close());

    const response = await app.inject({
      method: 'POST',
      url: '/v1/drc/apply-fixes',
      headers: AUTH_HEADER,
      payload: {
        assembly_id: assemblyId,
        fix_ids: ['FIX_LABEL_OFFSET_DEFAULT'],
      },
    });

    t.equal(response.statusCode, 400);
    const payload = response.json();
    t.equal(payload.code, 'FIX_NOT_AVAILABLE');
    fetchStub.ensureConsumed(t);
  });
});
