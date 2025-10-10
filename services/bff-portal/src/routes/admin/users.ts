import { readFileSync } from 'fs';
import { join } from 'path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { adminGuard } from '../../lib/adminGuard.js';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: 'active' | 'deactivated';
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

// In-memory store for dev - load from file
let adminUsers: AdminUser[] = [];

try {
  const dataPath = join(process.cwd(), '.data', 'admin-users.dev.json');
  const data = readFileSync(dataPath, 'utf-8');
  adminUsers = JSON.parse(data);
} catch (error) {
  console.warn('Could not load admin users dev data:', error);
  // Fallback to empty array
  adminUsers = [];
}

/**
 * Set admin users (for testing)
 */
export function setAdminUsers(users: AdminUser[]) {
  adminUsers = users;
}

/**
 * Get admin users (for testing)
 */
export function getAdminUsers() {
  return adminUsers;
}

type ListUsersQuery = {
  query?: string;
  limit?: number;
  offset?: number;
};

type UserIdParams = {
  id: string;
};

/**
 * Admin users routes
 * Provides CRUD operations for admin user management
 */
export async function adminUsersRoutes(fastify: FastifyInstance) {
  // GET /admin/users - List admin users with search and pagination
  fastify.get<{ Querystring: ListUsersQuery }>(
    '/admin/users',
    {
      preHandler: adminGuard,
      schema: {
        querystring: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      const { query, limit = 25, offset = 0 } = request.query ?? {};

      let filteredUsers = adminUsers;

      // Apply search filter if provided
      if (query && query.trim()) {
        const searchTerm = query.toLowerCase().trim();
        filteredUsers = adminUsers.filter(
          (user) =>
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm),
        );
      }

      // Apply pagination
      const total = filteredUsers.length;
      const items = filteredUsers.slice(offset, offset + limit);

      const requestId = request.id;
      reply.header('x-request-id', requestId);

      return {
        items,
        total,
        limit,
        offset,
      };
    },
  );

  // POST /admin/users/:id/deactivate - Deactivate a user
  fastify.post<{ Params: UserIdParams }>(
    '/admin/users/:id/deactivate',
    {
      preHandler: adminGuard,
    },
    async (request, reply) => {
      const { id } = request.params;

      const userIndex = adminUsers.findIndex((user) => user.id === id);
      if (userIndex === -1) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      // Update user status
      adminUsers[userIndex] = {
        ...adminUsers[userIndex],
        status: 'deactivated',
        updatedAt: new Date().toISOString(),
      };

      const requestId = request.id;
      reply.header('x-request-id', requestId);

      return adminUsers[userIndex];
    },
  );

  // POST /admin/users/:id/reactivate - Reactivate a user
  fastify.post<{ Params: UserIdParams }>(
    '/admin/users/:id/reactivate',
    {
      preHandler: adminGuard,
    },
    async (request, reply) => {
      const { id } = request.params;

      const userIndex = adminUsers.findIndex((user) => user.id === id);
      if (userIndex === -1) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      // Update user status
      adminUsers[userIndex] = {
        ...adminUsers[userIndex],
        status: 'active',
        updatedAt: new Date().toISOString(),
      };

      const requestId = request.id;
      reply.header('x-request-id', requestId);

      return adminUsers[userIndex];
    },
  );
}
