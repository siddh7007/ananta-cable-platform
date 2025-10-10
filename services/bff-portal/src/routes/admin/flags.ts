/**
 * Admin feature flags routes
 * Provides endpoints to list and toggle feature flags at org/workspace scope
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { adminGuard } from '../../lib/adminGuard.js';

interface FeatureFlag {
  key: string;
  description?: string;
  enabled: boolean;
  scope: 'org' | 'workspace';
  workspaceId?: string;
  updatedAt?: string;
}

interface ListFlagsQuery {
  scope?: 'org' | 'workspace';
  workspaceId?: string;
}

interface ToggleFlagBody {
  key: string;
  enabled: boolean;
  scope: 'org' | 'workspace';
  workspaceId?: string;
}

// Path to dev data file
const DEV_DATA_PATH = join(process.cwd(), '.data', 'admin-flags.dev.json');

// Load flags from dev data file
async function loadFlags(): Promise<FeatureFlag[]> {
  try {
    const data = await readFile(DEV_DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('Failed to load feature flags, returning empty array:', error);
    return [];
  }
}

// Save flags to dev data file
async function saveFlags(flags: FeatureFlag[]): Promise<void> {
  try {
    await writeFile(DEV_DATA_PATH, JSON.stringify(flags, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save feature flags:', error);
    throw error;
  }
}

export async function adminFlagsRoutes(fastify: FastifyInstance) {
  // GET /admin/flags - List feature flags
  fastify.get<{ Querystring: ListFlagsQuery }>(
    '/admin/flags',
    {
      preHandler: adminGuard,
      schema: {
        querystring: {
          type: 'object',
          properties: {
            scope: { type: 'string', enum: ['org', 'workspace'] },
            workspaceId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              required: ['key', 'enabled', 'scope'],
              properties: {
                key: { type: 'string' },
                description: { type: 'string' },
                enabled: { type: 'boolean' },
                scope: { type: 'string', enum: ['org', 'workspace'] },
                workspaceId: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { scope = 'org', workspaceId } = request.query;

      const allFlags = await loadFlags();

      // Filter by scope
      let filteredFlags = allFlags.filter((flag) => flag.scope === scope);

      // If workspace scope, filter by workspaceId
      if (scope === 'workspace' && workspaceId) {
        filteredFlags = filteredFlags.filter(
          (flag) => flag.workspaceId === workspaceId,
        );
      }

      const requestId = request.id;
      reply.header('x-request-id', requestId);

      return filteredFlags;
    },
  );

  // POST /admin/flags/toggle - Toggle a feature flag
  fastify.post<{ Body: ToggleFlagBody }>(
    '/admin/flags/toggle',
    {
      preHandler: adminGuard,
      schema: {
        body: {
          type: 'object',
          required: ['key', 'enabled', 'scope'],
          properties: {
            key: { type: 'string' },
            enabled: { type: 'boolean' },
            scope: { type: 'string', enum: ['org', 'workspace'] },
            workspaceId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['success', 'flag'],
            properties: {
              success: { type: 'boolean' },
              flag: {
                type: 'object',
                required: ['key', 'enabled', 'scope'],
                properties: {
                  key: { type: 'string' },
                  description: { type: 'string' },
                  enabled: { type: 'boolean' },
                  scope: { type: 'string', enum: ['org', 'workspace'] },
                  workspaceId: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { key, enabled, scope, workspaceId } = request.body;

      const allFlags = await loadFlags();

      // Find the flag
      const flagIndex = allFlags.findIndex((flag) => {
        if (scope === 'workspace') {
          return (
            flag.key === key &&
            flag.scope === scope &&
            flag.workspaceId === workspaceId
          );
        }
        return flag.key === key && flag.scope === scope;
      });

      if (flagIndex === -1) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: `Feature flag '${key}' not found for scope '${scope}'${workspaceId ? ` and workspaceId '${workspaceId}'` : ''}`,
        });
      }

      // Update the flag
      allFlags[flagIndex] = {
        ...allFlags[flagIndex],
        enabled,
        updatedAt: new Date().toISOString(),
      };

      // Save to file
      await saveFlags(allFlags);

      const requestId = request.id;
      reply.header('x-request-id', requestId);

      return {
        success: true,
        flag: allFlags[flagIndex],
        message: `Feature flag '${key}' ${enabled ? 'enabled' : 'disabled'}`,
      };
    },
  );
}
