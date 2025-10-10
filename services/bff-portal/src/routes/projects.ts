/**
 * Projects routes - development stubs
 * Provides endpoints to list and get projects when DEV_STUBS=true
 */

import type {
  FastifyPluginCallback,
  FastifyRequest,
  FastifyReply,
  FastifySchema,
} from 'fastify';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Path to dev data file
const DEV_DATA_PATH = join(process.cwd(), '.data', 'projects.dev.json');

// Load projects from dev data file (synchronous dev read)
let projects: Array<{
  id: string;
  name: string;
  status: 'draft' | 'active' | 'archived';
}> = [];

try {
  const data = readFileSync(DEV_DATA_PATH, 'utf-8');
  projects = JSON.parse(data);
} catch (error) {
  console.warn('Failed to load projects dev data, using empty array:', error);
  projects = [];
}

type RouteSchema = FastifySchema & {
  description?: string;
  tags?: string[];
};

const listProjectsSchema: RouteSchema = {
  description: 'List projects',
  tags: ['projects'],
  response: {
    200: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              status: { type: 'string', enum: ['draft', 'active', 'archived'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'integer', minimum: 0 },
      },
    },
  },
};

const getProjectSchema: RouteSchema = {
  description: 'Get project by ID',
  tags: ['projects'],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'active', 'archived'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};

export const projectsRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  // GET /v1/projects - List all projects
  fastify.get(
    '/v1/projects',
    {
      schema: listProjectsSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Check if DEV_STUBS is enabled
      if (process.env.DEV_STUBS !== 'true') {
        reply.code(404).send({ error: 'Not Found' });
        return;
      }

      reply
        .header('content-type', 'application/json')
        .header('x-request-id', (request.headers['x-request-id'] as string) || '')
        .send({ items: projects, total: projects.length });
    },
  );

  // GET /v1/projects/:id - Get specific project
  fastify.get(
    '/v1/projects/:id',
    {
      schema: getProjectSchema,
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      // Check if DEV_STUBS is enabled
      if (process.env.DEV_STUBS !== 'true') {
        reply.code(404).send({ error: 'Not Found' });
        return;
      }

      const { id } = request.params;
      const project = projects.find((p) => p.id === id);

      if (!project) {
        reply
          .code(404)
          .header('content-type', 'application/json')
          .header('x-request-id', (request.headers['x-request-id'] as string) || '')
          .send({ error: 'Not Found', message: 'Project not found' });
        return;
      }

      reply
        .header('content-type', 'application/json')
        .header('x-request-id', (request.headers['x-request-id'] as string) || '')
        .send(project);
    },
  );

  done();
};
