import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { DRCDao } from '../dao/drc.js';
import { AssembliesDAO } from '../dao/assemblies.js';
import { getAjv } from '@cable-platform/validation';
import { httpClient, HttpClient } from '../lib/http.js';
import { createRequire } from 'module';
import { ErrorCode } from '../../../../shared/libs/error-codes.js';

const require = createRequire(import.meta.url);
const openapiSpec = require('../../../../packages/contracts/openapi.json');

interface AuthenticatedRequest extends FastifyRequest {
  user?: { sub: string };
}

type AssemblySchemaRecord = {
  assembly_id: string;
  draft_id: string;
  schema: Record<string, unknown>;
  schema_hash: string;
  created_at: string;
  updated_at: string;
};

export interface DrcRouteOptions {
  drcDao?: Pick<DRCDao, 'upsertReport' | 'getReport'>;
  assembliesDao?: Pick<AssembliesDAO, 'getAssemblySchema' | 'updateAssemblySchema'>;
  httpClient?: Pick<HttpClient, 'get' | 'post' | 'put' | 'patch' | 'delete'>;
}

const ajv = getAjv();
const openapi = openapiSpec as { components?: { schemas?: Record<string, object> } };
const schemas = openapi.components?.schemas ?? {};

for (const [name, schema] of Object.entries(schemas)) {
  ajv.addSchema(schema, `#/components/schemas/${name}`);
}

function compileSchema(name: string) {
  const schema = schemas[name];
  if (!schema) {
    throw new Error(`Schema ${name} not found in OpenAPI components`);
  }
  return ajv.compile(schema);
}

const validateRulesetsResponse = compileSchema('DRCRulesetsResponse');
const validateRunRequest = compileSchema('DRCRunRequest');
const validateReport = compileSchema('DRCReport');
const validateApplyRequest = compileSchema('DRCApplyFixesRequest');
const validateApplyResponse = compileSchema('DRCApplyFixesResponse');

function buildRulesServiceUrl(path: string): string {
  const base = process.env.DRC_SERVICE_URL ?? 'http://localhost:8000';
  return `${base.replace(/\/$/, '')}${path}`;
}

async function requireAuth(request: AuthenticatedRequest, reply: FastifyReply) {
  const devBypass = (process.env.DEV_AUTH_BYPASS ?? 'false') === 'true';
  if (devBypass) {
    request.user = { sub: 'dev-user' };
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: ErrorCode.UNAUTHORIZED });
  }

  // TODO: verify JWT with Auth0; for now accept authenticated header
  request.user = { sub: 'authenticated-user' };
}

function createAssemblyPayload(record: AssemblySchemaRecord) {
  const schema = (record.schema ?? {}) as Record<string, unknown>;
  return {
    assembly_id: record.assembly_id,
    schema_hash: record.schema_hash,
    cable: schema.cable ?? {},
    conductors: schema.conductors ?? {},
    endpoints: schema.endpoints ?? {},
    shield: schema.shield ?? {},
    wirelist: Array.isArray(schema.wirelist) ? schema.wirelist : [],
    bom: Array.isArray(schema.bom) ? schema.bom : [],
    labels: schema.labels,
  };
}

function extractDesignSchema(assembly: Record<string, unknown>) {
  return {
    cable: assembly.cable ?? {},
    conductors: assembly.conductors ?? {},
    endpoints: assembly.endpoints ?? {},
    shield: assembly.shield ?? {},
    wirelist: Array.isArray(assembly.wirelist) ? assembly.wirelist : [],
    bom: Array.isArray(assembly.bom) ? assembly.bom : [],
    labels: assembly.labels ?? undefined,
  };
}

export async function drcRoutes(fastify: FastifyInstance, options: DrcRouteOptions = {}) {
  const {
    drcDao = new DRCDao(),
    assembliesDao = new AssembliesDAO(),
    httpClient: client = httpClient,
  } = options;

  fastify.get('/v1/drc/rulesets', {
    preHandler: requireAuth,
    handler: async (request, reply) => {
      try {
        const response = await client.get(buildRulesServiceUrl('/drc/rulesets'));
        if (!response.response.ok) {
          return reply.status(response.status).send({ error: 'Failed to fetch rulesets' });
        }

        const payload = response.data;
        if (!validateRulesetsResponse(payload)) {
          const message = ajv.errorsText(validateRulesetsResponse.errors);
          return reply.status(502).send({
            code: 'SCHEMA_VALIDATION_FAILED',
            message,
            details: validateRulesetsResponse.errors,
          });
        }

        return reply.status(200).send(payload);
      } catch (error) {
        request.log.error({ err: error }, 'Failed to fetch DRC rulesets');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  });

  fastify.post('/v1/drc/run', {
    preHandler: requireAuth,
    handler: async (request, reply) => {
      const body = request.body ?? {};
      if (!validateRunRequest(body)) {
        const message = ajv.errorsText(validateRunRequest.errors);
        return reply.status(400).send({
          code: 'INVALID_REQUEST',
          message,
          details: validateRunRequest.errors,
        });
      }

      const { assembly_id, ruleset_id } = body as { assembly_id: string; ruleset_id: string };

      try {
        const assemblyRecord = await assembliesDao.getAssemblySchema(assembly_id);
        if (!assemblyRecord) {
          return reply.status(404).send({ error: 'Assembly not found' });
        }

        const assemblyPayload = createAssemblyPayload(assemblyRecord as AssemblySchemaRecord);
        const payload = {
          assembly_id,
          schema: assemblyPayload,
          ...(ruleset_id ? { ruleset_id } : {}),
        };

        const response = await client.post(buildRulesServiceUrl('/drc/run'), payload);

        if (!response.response.ok) {
          const errorBody = response.data;
          return reply.status(response.status).send(errorBody ?? { error: 'DRC run failed' });
        }

        const drcReport = response.data;
        if (!validateReport(drcReport)) {
          const message = ajv.errorsText(validateReport.errors);
          return reply.status(502).send({
            code: 'SCHEMA_VALIDATION_FAILED',
            message,
            details: validateReport.errors,
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await drcDao.upsertReport(drcReport as any);
        return reply.status(200).send(drcReport);
      } catch (error) {
        request.log.error({ err: error }, 'Failed to run DRC');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  });

  fastify.post('/v1/drc/apply-fixes', {
    preHandler: requireAuth,
    handler: async (request, reply) => {
      const body = request.body ?? {};
      if (!validateApplyRequest(body)) {
        const message = ajv.errorsText(validateApplyRequest.errors);
        return reply.status(400).send({
          code: 'INVALID_REQUEST',
          message,
          details: validateApplyRequest.errors,
        });
      }

      const { assembly_id, fix_ids, ruleset_id } = body as { assembly_id: string; fix_ids: string[]; ruleset_id: string };

      try {
        const assemblyRecord = await assembliesDao.getAssemblySchema(assembly_id);
        if (!assemblyRecord) {
          return reply.status(404).send({ error: 'Assembly not found' });
        }

        const latestReport = await drcDao.getReport(assembly_id);
        if (!latestReport) {
          return reply.status(400).send({
            code: 'DRC_REPORT_NOT_FOUND',
            message: 'Run DRC before applying fixes.',
          });
        }

        const availableFixes = new Set((latestReport.fixes ?? []).map(fix => fix.id));
        const missingFixes = fix_ids.filter((fixId: string) => !availableFixes.has(fixId));
        if (missingFixes.length > 0) {
          return reply.status(400).send({
            code: 'FIX_NOT_AVAILABLE',
            message: `Fixes not available on latest report: ${missingFixes.join(', ')}`,
          });
        }

        const assemblyPayload = createAssemblyPayload(assemblyRecord as AssemblySchemaRecord);
        const requestPayload = {
          assembly_id,
          fix_ids,
          schema: assemblyPayload,
          ...(ruleset_id ? { ruleset_id } : {}),
        };
        const response = await client.post(buildRulesServiceUrl('/drc/apply-fixes'), requestPayload);

        if (!response.response.ok) {
          const errorBody = response.data;
          return reply.status(response.status).send(errorBody ?? { error: 'Apply fixes failed' });
        }

        const applyResponse = response.data;
        if (!validateApplyResponse(applyResponse)) {
          const message = ajv.errorsText(validateApplyResponse.errors);
          return reply.status(502).send({
            code: 'SCHEMA_VALIDATION_FAILED',
            message,
            details: validateApplyResponse.errors,
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedApplyResponse = applyResponse as { schema: any; schema_hash: string; drc: any };
        const designSchema = extractDesignSchema(typedApplyResponse.schema);
        await assembliesDao.updateAssemblySchema(assembly_id, designSchema, typedApplyResponse.schema_hash);
        await drcDao.upsertReport(typedApplyResponse.drc);

        return reply.status(200).send(applyResponse);
      } catch (error) {
        request.log.error({ err: error }, 'Failed to apply DRC fixes');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  });

  fastify.get('/v1/drc/report/:assembly_id', {
    preHandler: requireAuth,
    handler: async (request, reply) => {
      const { assembly_id } = request.params as { assembly_id: string };

      try {
        const report = await drcDao.getReport(assembly_id);
        if (!report) {
          return reply.status(404).send({ error: 'DRC report not found' });
        }

        return reply.status(200).send(report);
      } catch (error) {
        request.log.error({ err: error }, 'Failed to load DRC report');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  });
}
