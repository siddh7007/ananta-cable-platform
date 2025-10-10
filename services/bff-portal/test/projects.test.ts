import { test } from 'tap';
import { build } from '../src/app.js';

test('Projects routes - list projects with DEV_STUBS=true', async (t) => {
  // Set DEV_STUBS=true for this test
  process.env.DEV_STUBS = 'true';

  const server = await build();
  t.teardown(() => {
    server.close();
    delete process.env.DEV_STUBS;
  });

  const response = await server.inject({
    method: 'GET',
    url: '/v1/projects',
  });

  t.equal(response.statusCode, 200, 'should return 200');
  t.equal(response.headers['content-type'], 'application/json; charset=utf-8', 'should set content-type');
  const body = JSON.parse(response.body);
  t.ok(Array.isArray(body.items), 'should return items array');
  t.equal(body.total, 3, 'should return total of 3');
  t.equal(body.items.length, 3, 'should return 3 items');
  t.equal(body.items[0].id, 'p-001', 'should return first project');
  t.equal(body.items[0].name, 'Demo Cable A', 'should return first project name');
  t.equal(body.items[0].status, 'active', 'should return first project status');
});

test('Projects routes - list projects with DEV_STUBS=false', async (t) => {
  // Ensure DEV_STUBS is not set
  delete process.env.DEV_STUBS;

  const server = await build();
  t.teardown(() => server.close());

  const response = await server.inject({
    method: 'GET',
    url: '/v1/projects',
  });

  t.equal(response.statusCode, 404, 'should return 404 when DEV_STUBS is disabled');
});

test('Projects routes - get project by id with valid id', async (t) => {
  process.env.DEV_STUBS = 'true';

  const server = await build();
  t.teardown(() => {
    server.close();
    delete process.env.DEV_STUBS;
  });

  const response = await server.inject({
    method: 'GET',
    url: '/v1/projects/p-001',
  });

  t.equal(response.statusCode, 200, 'should return 200');
  t.equal(response.headers['content-type'], 'application/json; charset=utf-8', 'should set content-type');
  const body = JSON.parse(response.body);
  t.equal(body.id, 'p-001', 'should return correct project id');
  t.equal(body.name, 'Demo Cable A', 'should return correct project name');
  t.equal(body.status, 'active', 'should return correct project status');
});

test('Projects routes - get project by id with invalid id', async (t) => {
  process.env.DEV_STUBS = 'true';

  const server = await build();
  t.teardown(() => {
    server.close();
    delete process.env.DEV_STUBS;
  });

  const response = await server.inject({
    method: 'GET',
    url: '/v1/projects/invalid-id',
  });

  t.equal(response.statusCode, 404, 'should return 404 for invalid id');
  t.equal(response.headers['content-type'], 'application/json; charset=utf-8', 'should set content-type');
  const body = JSON.parse(response.body);
  t.equal(body.error, 'Not Found', 'should return error message');
  t.equal(body.message, 'Project not found', 'should return specific message');
});

test('Projects routes - get project by id with DEV_STUBS=false', async (t) => {
  delete process.env.DEV_STUBS;

  const server = await build();
  t.teardown(() => server.close());

  const response = await server.inject({
    method: 'GET',
    url: '/v1/projects/p-001',
  });

  t.equal(response.statusCode, 404, 'should return 404 when DEV_STUBS is disabled');
});