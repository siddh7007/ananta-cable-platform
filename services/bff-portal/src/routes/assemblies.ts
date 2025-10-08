import { FastifyInstance, FastifyRequest } from 'fastify';
import { AssembliesDAO } from '../dao/assemblies.js';
import type { AssemblyDraft } from '@cable-platform/contracts/types/api';

// Extend FastifyRequest to include user property
interface AuthenticatedRequest extends FastifyRequest {
  user?: { sub: string };
}

const assembliesDao = new AssembliesDAO();

export async function assemblyRoutes(fastify: FastifyInstance) {
  // POST /v1/assemblies/draft - Save draft assembly
  fastify.post('/v1/assemblies/draft', {
    handler: async (request: AuthenticatedRequest, reply) => {
      const userId = request.user?.sub || 'anonymous';
      const draft = request.body as AssemblyDraft;

      try {
        const result = await assembliesDao.saveDraft(userId, draft);
        return reply.status(201).send(result);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });

  // GET /v1/assemblies/draft/{draftId} - Get draft assembly
  fastify.get('/v1/assemblies/draft/:draftId', {
    handler: async (request: AuthenticatedRequest, reply) => {
      const { draftId } = request.params as { draftId: string };
      const userId = request.user?.sub || 'anonymous';

      try {
        const draft = await assembliesDao.getDraft(draftId);
        if (!draft) {
          return reply.status(404).send({ error: 'Draft not found' });
        }

        // Check ownership (in production, implement proper authorization)
        if (draft.user_id !== userId) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        return reply.send(draft);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });
}