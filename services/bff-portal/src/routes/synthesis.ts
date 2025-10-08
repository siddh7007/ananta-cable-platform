import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SynthesisDAO } from '../dao/synthesis.js';
import { AssembliesDAO } from '../dao/assemblies.js';
import { getAjv } from '@cable-platform/validation';
import crypto from 'crypto';

// Extend FastifyRequest to include user property
interface AuthenticatedRequest extends FastifyRequest {
  user?: { sub: string };
}

const synthesisDao = new SynthesisDAO();
const assembliesDao = new AssembliesDAO();

// Initialize AJV validators (compile once)
const ajv = getAjv();

// For now, we'll create basic validators - in production these would be from OpenAPI schemas
const validateSynthesisProposal = ajv.compile({
  type: 'object',
  properties: {
    proposal_id: { type: 'string' },
    draft_id: { type: 'string' },
    cable: { type: 'object' },
    conductors: { type: 'object' },
    endpoints: { type: 'object' },
    shield: { type: 'object' },
    wirelist: { type: 'array' },
    bom: { type: 'array' },
    warnings: { type: 'array', items: { type: 'string' } },
    errors: { type: 'array', items: { type: 'string' } },
    explain: { type: 'array', items: { type: 'string' } }
  },
  required: ['proposal_id', 'draft_id', 'cable', 'conductors', 'endpoints', 'shield', 'wirelist', 'bom', 'warnings', 'errors', 'explain']
});

const validateDrcResult = ajv.compile({
  type: 'object',
  properties: {
    status: { enum: ['pass', 'warning', 'error'] },
    issues: { type: 'array' },
    summary: { type: 'string' }
  },
  required: ['status', 'issues', 'summary']
});

// Auth hook
async function requireAuth(request: AuthenticatedRequest, reply: FastifyReply) {
  const devBypass = (process.env.DEV_AUTH_BYPASS ?? "false") === "true";

  if (devBypass) {
    request.user = { sub: 'dev-user' };
    return;
  }

  // TODO: Implement Auth0 JWT verification
  // For now, require Authorization header
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  // In production, verify JWT here
  request.user = { sub: 'authenticated-user' };
}

export async function synthesisRoutes(fastify: FastifyInstance) {
  // POST /v1/synthesis/propose - Generate synthesis proposal
  fastify.post('/v1/synthesis/propose', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply) => {
      const { draft_id } = request.body as { draft_id: string };
      const userId = request.user!.sub;

      try {
        // 1. Load Step-1 draft with status 'ready_for_step2'
        const draft = await assembliesDao.getDraft(draft_id);
        if (!draft) {
          return reply.status(404).send({ error: 'Draft not found' });
        }

        if (draft.status !== 'ready_for_step2') {
          return reply.status(400).send({ error: 'Draft is not ready for synthesis' });
        }

        // Check ownership
        if (draft.user_id !== userId) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        // 2. Call FastAPI /synthesize/propose
        const drcServiceUrl = process.env.DRC_SERVICE_URL || 'http://localhost:8000';
        const response = await fetch(`${drcServiceUrl}/v1/synthesis/propose`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            draft_id,
            step1_payload: draft.payload
          })
        });

        if (!response.ok) {
          throw new Error(`DRC service error: ${response.status}`);
        }

        const proposal = await response.json();

        // 3. Validate response against OpenAPI schema
        if (!validateSynthesisProposal(proposal)) {
          return reply.status(502).send({
            code: 'SCHEMA_VALIDATION_FAILED',
            message: 'DRC service returned invalid proposal schema',
            details: ajv.errorsText(validateSynthesisProposal.errors)
          });
        }

        // 4. Upsert assemblies_synthesis
        await synthesisDao.saveProposal(draft_id, proposal);

        // 5. Return the proposal
        return reply.status(200).send(proposal);

      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });

  // POST /v1/synthesis/recompute - Recompute with user locks
  fastify.post('/v1/synthesis/recompute', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply) => {
      const { draft_id, locks } = request.body as { draft_id: string; locks?: Record<string, unknown> };
      const userId = request.user!.sub;

      try {
        // Similar to propose but merge locks into the call
        const draft = await assembliesDao.getDraft(draft_id);
        if (!draft) {
          return reply.status(404).send({ error: 'Draft not found' });
        }

        if (draft.status !== 'ready_for_step2') {
          return reply.status(400).send({ error: 'Draft is not ready for synthesis' });
        }

        if (draft.user_id !== userId) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        // Call DRC service with locks merged
        const drcServiceUrl = process.env.DRC_SERVICE_URL || 'http://localhost:8000';
        const payload = {
          draft_id,
          step1_payload: draft.payload
        };

        // Merge locks if provided
        if (locks) {
          Object.assign(payload.step1_payload, locks);
        }

        const response = await fetch(`${drcServiceUrl}/v1/synthesis/propose`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`DRC service error: ${response.status}`);
        }

        const proposal = await response.json();

        if (!validateSynthesisProposal(proposal)) {
          return reply.status(502).send({
            code: 'SCHEMA_VALIDATION_FAILED',
            message: 'DRC service returned invalid proposal schema'
          });
        }

        await synthesisDao.saveProposal(draft_id, proposal);
        return reply.status(200).send(proposal);

      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });

  // POST /v1/synthesis/accept - Accept proposal and create schema
  fastify.post('/v1/synthesis/accept', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply) => {
      const { proposal_id, locks } = request.body as { proposal_id: string; locks?: Record<string, unknown> };

      try {
        // 1. Load proposal
        const proposalRecord = await synthesisDao.getProposal(proposal_id);
        if (!proposalRecord) {
          return reply.status(404).send({ error: 'Proposal not found' });
        }

        const proposal = proposalRecord.payload;

        // 2. Ensure no errors
        if (proposal.errors && proposal.errors.length > 0) {
          return reply.status(400).send({ error: 'Cannot accept proposal with errors' });
        }

        // 3. Persist assemblies_schema
        const schema = {
          ...proposal,
          locks: locks || {}
        };

        // Generate hash of the schema
        const schemaHash = crypto.createHash('sha256')
          .update(JSON.stringify(schema))
          .digest('hex');

        const schemaRecord = await synthesisDao.saveSchema(
          proposalRecord.draft_id,
          schema,
          schemaHash
        );

        // 4. Return result
        return reply.status(200).send({
          assembly_id: schemaRecord.assembly_id,
          schema_hash: schemaRecord.schema_hash
        });

      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });

  // POST /v1/drc/preview - Proxy to DRC service
  fastify.post('/v1/drc/preview', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply) => {
      const proposal = request.body;

      try {
        // Validate input
        if (!validateSynthesisProposal(proposal)) {
          return reply.status(400).send({
            code: 'SCHEMA_VALIDATION_FAILED',
            message: 'Invalid proposal schema',
            details: ajv.errorsText(validateSynthesisProposal.errors)
          });
        }

        // Proxy to DRC service
        const drcServiceUrl = process.env.DRC_SERVICE_URL || 'http://localhost:8000';
        const response = await fetch(`${drcServiceUrl}/v1/drc/preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(proposal)
        });

        if (!response.ok) {
          throw new Error(`DRC service error: ${response.status}`);
        }

        const result = await response.json();

        // Validate response
        if (!validateDrcResult(result)) {
          return reply.status(502).send({
            code: 'SCHEMA_VALIDATION_FAILED',
            message: 'DRC service returned invalid result schema'
          });
        }

        return reply.status(200).send(result);

      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });
}