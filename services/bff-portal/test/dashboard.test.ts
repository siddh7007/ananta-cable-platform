import { test } from 'tap';
import { build } from '../src/app.js';

test('Dashboard routes - recent projects', async (t) => {
  const server = await build();
  t.teardown(() => server.close());

  const response = await server.inject({
    method: 'GET',
    url: '/v1/dashboard/projects/recent',
  });

  t.equal(response.statusCode, 200, 'should return 200');
  const body = JSON.parse(response.body);
  t.ok(Array.isArray(body.projects), 'should return projects array');
  t.equal(body.projects.length, 0, 'should return empty array (stub)');
});

test('Dashboard routes - latest quotes', async (t) => {
  const server = await build();
  t.teardown(() => server.close());

  const response = await server.inject({
    method: 'GET',
    url: '/v1/dashboard/quotes/latest',
  });

  t.equal(response.statusCode, 200, 'should return 200');
  const body = JSON.parse(response.body);
  t.ok(Array.isArray(body.quotes), 'should return quotes array');
  t.equal(body.quotes.length, 0, 'should return empty array (stub)');
});

test('Dashboard routes - recent orders', async (t) => {
  const server = await build();
  t.teardown(() => server.close());

  const response = await server.inject({
    method: 'GET',
    url: '/v1/dashboard/orders/recent',
  });

  t.equal(response.statusCode, 200, 'should return 200');
  const body = JSON.parse(response.body);
  t.ok(Array.isArray(body.orders), 'should return orders array');
  t.equal(body.orders.length, 0, 'should return empty array (stub)');
});
