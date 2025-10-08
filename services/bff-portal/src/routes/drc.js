import { DRCDao } from '../dao/drc.js';
import { AssembliesDAO } from '../dao/assemblies.js';
import { getAjv } from '@cable-platform/validation';
const drcDao = new DRCDao();
const assembliesDao = new AssembliesDAO();
// Initialize AJV validators (compile once)
const ajv = getAjv();
// DRC Report validator
const validateDRCReport = ajv.compile({
    type: 'object',
    properties: {
        assembly_id: { type: 'string' },
        ruleset_id: { type: 'string' },
        version: { type: 'string' },
        passed: { type: 'boolean' },
        errors: { type: 'integer', minimum: 0 },
        warnings: { type: 'integer', minimum: 0 },
        findings: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    severity: { enum: ['error', 'warning', 'info'] },
                    domain: { enum: ['mechanical', 'electrical', 'standards', 'labeling', 'consistency'] },
                    code: { type: 'string' },
                    message: { type: 'string' },
                    where: { type: 'string' },
                    refs: { type: 'array', items: { type: 'string' } }
                },
                required: ['id', 'severity', 'domain', 'code', 'message']
            }
        },
        fixes: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    label: { type: 'string' },
                    description: { type: 'string' },
                    domain: { enum: ['mechanical', 'electrical', 'standards', 'labeling', 'consistency'] },
                    applies_to: { type: 'array', items: { type: 'string' } }
                },
                required: ['id', 'label', 'description', 'domain']
            }
        }
    },
    required: ['assembly_id', 'ruleset_id', 'version', 'passed', 'errors', 'warnings', 'findings', 'fixes']
});
// DRC Apply Fixes Response validator
const validateDRCApplyFixesResponse = ajv.compile({
    type: 'object',
    properties: {
        assembly_id: { type: 'string' },
        schema_hash: { type: 'string' },
        schema: { type: 'object' },
        drc: validateDRCReport.schema
    },
    required: ['assembly_id', 'schema_hash', 'schema', 'drc']
});
export async function drcRoutes(fastify) {
    console.log('DRC routes being registered...');
    // GET /v1/drc/rulesets - Get available DRC rulesets
    fastify.get('/v1/drc/rulesets', {
        handler: async (request, reply) => {
            try {
                // Call DRC Rules service
                const rulesServiceUrl = process.env.DRC_SERVICE_URL || 'http://localhost:8000';
                const response = await fetch(`${rulesServiceUrl}/drc/rulesets`);
                if (!response.ok) {
                    return reply.status(response.status).send({ error: 'Failed to fetch rulesets' });
                }
                const data = await response.json();
                return reply.send(data);
            }
            catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    });
    console.log('DRC GET /v1/drc/rulesets registered');
    // POST /v1/drc/run - Run DRC on an assembly
    console.log('About to register POST /v1/drc/run');
    fastify.post('/v1/drc/run', {
        handler: async (request, reply) => {
            console.log('POST /v1/drc/run handler called with body:', request.body);
            const { assembly_id, ruleset_id } = request.body;
            try {
                console.log('Handler: Getting assembly schema for', assembly_id);
                // 1. Load AssemblySchema by assembly_id from assemblies_schema
                const assemblySchema = await assembliesDao.getAssemblySchema(assembly_id);
                console.log('Handler: Got assembly schema', !!assemblySchema);
                if (!assemblySchema) {
                    console.log('Handler: Assembly not found, returning 404');
                    return reply.status(404).send({ error: 'Assembly not found' });
                }
                // 2. Call FastAPI /drc/run with schema payload + ruleset_id
                const rulesServiceUrl = process.env.DRC_SERVICE_URL || 'http://localhost:8000';
                console.log('Handler: Calling DRC service at', rulesServiceUrl);
                const response = await fetch(`${rulesServiceUrl}/drc/run`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        assembly_id,
                        ruleset_id,
                        // Send the full schema for DRC analysis
                        cable: assemblySchema.schema.cable,
                        conductors: assemblySchema.schema.conductors,
                        endpoints: assemblySchema.schema.endpoints,
                        bom: assemblySchema.schema.bom,
                        labels: assemblySchema.schema.labels
                    })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    return reply.status(response.status).send({ error: errorData.detail || 'DRC run failed' });
                }
                const drcResult = await response.json();
                // 3. Validate response
                const valid = validateDRCReport(drcResult);
                if (!valid) {
                    request.log.error({ msg: 'DRC report validation failed', errors: validateDRCReport.errors });
                    return reply.status(500).send({ error: 'Invalid DRC report response' });
                }
                // 4. Store the report
                const reportToStore = {
                    ...drcResult,
                    generated_at: new Date().toISOString()
                };
                await drcDao.upsertReport(reportToStore);
                return reply.send(drcResult);
            }
            catch (error) {
                console.log('Handler: Caught error', error);
                request.log.error(error);
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    });
    console.log('POST /v1/drc/run registration completed');
    console.log('DRC POST /v1/drc/run registered');
    // POST /v1/drc/apply-fixes - Apply DRC fixes to an assembly
    console.log('Registering POST /v1/drc/apply-fixes');
    fastify.post('/v1/drc/apply-fixes', {
        handler: async (request, reply) => {
            const { assembly_id, fix_ids, ruleset_id } = request.body;
            try {
                // 1. Load current schema
                const currentSchema = await assembliesDao.getAssemblySchema(assembly_id);
                if (!currentSchema) {
                    return reply.status(404).send({ error: 'Assembly not found' });
                }
                // 2. Call FastAPI /drc/apply-fixes
                const rulesServiceUrl = process.env.DRC_SERVICE_URL || 'http://localhost:8000';
                const response = await fetch(`${rulesServiceUrl}/drc/apply-fixes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        assembly_id,
                        fix_ids,
                        ruleset_id
                    })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    return reply.status(response.status).send({ error: errorData.detail || 'Apply fixes failed' });
                }
                const applyFixesResponse = await response.json();
                // 3. Validate response
                const valid = validateDRCApplyFixesResponse(applyFixesResponse);
                if (!valid) {
                    request.log.error({ msg: 'DRC apply fixes response validation failed', errors: validateDRCApplyFixesResponse.errors });
                    return reply.status(500).send({ error: 'Invalid apply fixes response' });
                }
                // 4. Update the assembly schema with the fixed schema
                const updatedSchema = applyFixesResponse.schema;
                await assembliesDao.updateAssemblySchema(assembly_id, updatedSchema, applyFixesResponse.schema_hash);
                // 5. Store the updated DRC report
                await drcDao.upsertReport(applyFixesResponse.drc);
                return reply.send(applyFixesResponse);
            }
            catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    });
    console.log('DRC POST /v1/drc/apply-fixes registered');
    // GET /v1/drc/report/:assembly_id - Get latest DRC report
    fastify.get('/v1/drc/report/:assembly_id', {
        handler: async (request, reply) => {
            const { assembly_id } = request.params;
            try {
                // Get the latest stored report
                const report = await drcDao.getReport(assembly_id);
                if (!report) {
                    return reply.status(404).send({ error: 'DRC report not found' });
                }
                return reply.send(report);
            }
            catch (error) {
                request.log.error(error);
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    });
    console.log('DRC routes registered successfully');
    console.log('Registered routes:', fastify.printRoutes());
}
