import type { Load } from '@sveltejs/kit';
import type { AdminUsersResponse, AdminUser } from '$lib/types/admin';

// Mock data for development - replace with real API calls later
const mockUsers: AdminUser[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    roles: ['user', 'admin'],
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-10-09T14:20:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    roles: ['user'],
    status: 'active',
    createdAt: '2024-02-20T09:15:00Z',
    updatedAt: '2024-09-15T11:45:00Z',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@company.com',
    roles: ['user', 'manager'],
    status: 'deactivated',
    createdAt: '2024-03-10T16:20:00Z',
    updatedAt: '2024-08-20T13:30:00Z',
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice.brown@company.com',
    roles: ['user'],
    status: 'active',
    createdAt: '2024-04-05T12:00:00Z',
    updatedAt: '2024-10-01T08:15:00Z',
  },
];

export const load: Load = async ({ url }) => {
  // Placeholder for future API call
  // const response = await api.getAdminUsers({ search, limit, offset });

  const search = url.searchParams.get('search') || '';
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  // Filter mock data based on search
  let filteredUsers = mockUsers;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = mockUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.roles.some((role) => role.toLowerCase().includes(searchLower)),
    );
  }

  // Apply pagination
  const paginatedUsers = filteredUsers.slice(offset, offset + limit);

  const response: AdminUsersResponse = {
    users: paginatedUsers,
    total: filteredUsers.length,
    limit,
    offset,
  };

  return {
    usersResponse: response,
    search,
    limit,
    offset,
  };
};
