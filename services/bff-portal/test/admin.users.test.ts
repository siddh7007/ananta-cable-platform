import 'dotenv/config';

import { test } from 'tap';
import { build } from '../src/app.js';
import { setAdminUsers, getAdminUsers } from '../src/routes/admin/users.js';

test('Admin Users API', async (t) => {
  const app = await build();

  t.teardown(() => app.close());

  // Test data setup - reset to known state
  const testUsers = [
    {
      id: 'test-user-1',
      name: 'Test Admin',
      email: 'admin@test.com',
      roles: ['admin'],
      status: 'active' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'test-user-2',
      name: 'Test User',
      email: 'user@test.com',
      roles: ['user'],
      status: 'active' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'test-user-3',
      name: 'Deactivated User',
      email: 'deactivated@test.com',
      roles: ['user'],
      status: 'deactivated' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T00:00:00Z',
    },
  ];

  // Set the test data using the exported function
  const originalUsers = getAdminUsers();
  setAdminUsers(testUsers);

  t.teardown(() => {
    setAdminUsers(originalUsers);
  });

  await t.test('GET /admin/users - returns paginated list', async (t) => {
    // Enable dev bypass for testing
    process.env.DEV_AUTH_BYPASS = 'true';

    const response = await app.inject({
      method: 'GET',
      url: '/admin/users',
    });

    t.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);

    t.ok(Array.isArray(body.items));
    t.equal(body.total, 3);
    t.equal(body.limit, 25);
    t.equal(body.offset, 0);
    t.equal(body.items.length, 3);

    // Check response structure
    const user = body.items[0];
    t.ok(user.id);
    t.ok(user.name);
    t.ok(user.email);
    t.ok(Array.isArray(user.roles));
    t.ok(['active', 'deactivated'].includes(user.status));
    t.ok(user.createdAt);
    t.ok(user.updatedAt);
    t.ok(user.lastLoginAt);
  });

  await t.test('GET /admin/users - supports search query', async (t) => {
    process.env.DEV_AUTH_BYPASS = 'true';

    const response = await app.inject({
      method: 'GET',
      url: '/admin/users?query=admin',
    });

    t.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);

    t.equal(body.total, 1);
    t.equal(body.items[0].name, 'Test Admin');
  });

  await t.test('GET /admin/users - supports pagination', async (t) => {
    process.env.DEV_AUTH_BYPASS = 'true';

    const response = await app.inject({
      method: 'GET',
      url: '/admin/users?limit=2&offset=1',
    });

    t.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);

    t.equal(body.limit, 2);
    t.equal(body.offset, 1);
    t.equal(body.items.length, 2);
    t.equal(body.total, 3);
  });

  await t.test('POST /admin/users/:id/deactivate - deactivates user', async (t) => {
    process.env.DEV_AUTH_BYPASS = 'true';

    const response = await app.inject({
      method: 'POST',
      url: '/admin/users/test-user-1/deactivate',
    });

    t.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);

    t.equal(body.id, 'test-user-1');
    t.equal(body.status, 'deactivated');
    t.ok(body.updatedAt !== '2024-01-01T00:00:00Z'); // Should be updated
  });

  await t.test('POST /admin/users/:id/reactivate - reactivates user', async (t) => {
    process.env.DEV_AUTH_BYPASS = 'true';

    const response = await app.inject({
      method: 'POST',
      url: '/admin/users/test-user-3/reactivate',
    });

    t.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);

    t.equal(body.id, 'test-user-3');
    t.equal(body.status, 'active');
    t.ok(body.updatedAt !== '2024-01-01T00:00:00Z'); // Should be updated
  });

  await t.test('POST /admin/users/:id/deactivate - returns 404 for unknown user', async (t) => {
    process.env.DEV_AUTH_BYPASS = 'true';

    const response = await app.inject({
      method: 'POST',
      url: '/admin/users/unknown-user/deactivate',
    });

    t.equal(response.statusCode, 404);
    const body = JSON.parse(response.payload);
    t.equal(body.error, 'Not Found');
  });

  await t.test('POST /admin/users/:id/reactivate - returns 404 for unknown user', async (t) => {
    process.env.DEV_AUTH_BYPASS = 'true';

    const response = await app.inject({
      method: 'POST',
      url: '/admin/users/unknown-user/reactivate',
    });

    t.equal(response.statusCode, 404);
    const body = JSON.parse(response.payload);
    t.equal(body.error, 'Not Found');
  });

  await t.test('GET /admin/users - returns 403 when not admin and dev bypass off', async (t) => {
    process.env.DEV_AUTH_BYPASS = 'false';

    const response = await app.inject({
      method: 'GET',
      url: '/admin/users',
    });

    t.equal(response.statusCode, 403);
    const body = JSON.parse(response.payload);
    t.equal(body.error, 'Forbidden');
  });

  await t.test(
    'POST /admin/users/:id/deactivate - returns 403 when not admin and dev bypass off',
    async (t) => {
      process.env.DEV_AUTH_BYPASS = 'false';

      const response = await app.inject({
        method: 'POST',
        url: '/admin/users/test-user-1/deactivate',
      });

      t.equal(response.statusCode, 403);
      const body = JSON.parse(response.payload);
      t.equal(body.error, 'Forbidden');
    },
  );

  await t.test(
    'POST /admin/users/:id/reactivate - returns 403 when not admin and dev bypass off',
    async (t) => {
      process.env.DEV_AUTH_BYPASS = 'false';

      const response = await app.inject({
        method: 'POST',
        url: '/admin/users/test-user-1/reactivate',
      });

      t.equal(response.statusCode, 403);
      const body = JSON.parse(response.payload);
      t.equal(body.error, 'Forbidden');
    },
  );
});
