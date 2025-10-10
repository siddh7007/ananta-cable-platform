import 'dotenv/config';

import { test } from 'tap';
import { build } from '../src/app.js';

test('Admin DB Stats API', async (t) => {
  const app = await build();

  t.teardown(() => app.close());

  await t.test('GET /admin/db/stats - returns stats when dev-bypass is true', async (t) => {
    process.env.DEV_AUTH_BYPASS = 'true';

    const response = await app.inject({
      method: 'GET',
      url: '/admin/db/stats',
    });

    t.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);

    // Check required fields
    t.ok(body.supabase, 'has supabase field');
    t.ok(body.supabase.status, 'supabase has status');
    t.ok(['ok', 'fail', 'unknown'].includes(body.supabase.status), 'supabase status is valid');

    t.ok(body.counts, 'has counts field');
    t.type(body.counts.workspaces, 'number', 'workspaces is number');
    t.type(body.counts.projects, 'number', 'projects is number');
    t.type(body.counts.boms, 'number', 'boms is number');
    t.type(body.counts.orders, 'number', 'orders is number');
    t.type(body.counts.users, 'number', 'users is number');

    t.ok(body.ts, 'has timestamp');
    t.match(body.ts, /^\d{4}-\d{2}-\d{2}T/, 'timestamp is ISO format');

    // Check optional fields
    if (body.pgExtra) {
      t.ok(['ok', 'fail', 'unknown'].includes(body.pgExtra.status), 'pgExtra status is valid');
    }
    if (body.oracle) {
      t.ok(['ok', 'fail', 'unknown'].includes(body.oracle.status), 'oracle status is valid');
    }

    // Check x-request-id header
    t.ok(response.headers['x-request-id'], 'has x-request-id header');
  });

  await t.test('GET /admin/db/stats - returns 403 when dev-bypass is false', async (t) => {
    process.env.DEV_AUTH_BYPASS = 'false';

    const response = await app.inject({
      method: 'GET',
      url: '/admin/db/stats',
    });

    t.equal(response.statusCode, 403);
    const body = JSON.parse(response.payload);
    t.equal(body.error, 'Forbidden');
  });

  await t.test('GET /admin/db/stats - handles missing DSNs gracefully', async (t) => {
    process.env.DEV_AUTH_BYPASS = 'true';

    // Temporarily clear DSN env vars
    const originalSupabase = process.env.SUPABASE_DATABASE_URL;
    const originalPgExtra = process.env.PG_EXTRA_DATABASE_URL;
    const originalOracle = process.env.ORACLE_CONNECT_STRING;

    delete process.env.SUPABASE_DATABASE_URL;
    delete process.env.PG_EXTRA_DATABASE_URL;
    delete process.env.ORACLE_CONNECT_STRING;

    const response = await app.inject({
      method: 'GET',
      url: '/admin/db/stats',
    });

    t.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);

    // Should return unknown status with note when not configured
    t.equal(body.supabase.status, 'unknown');
    t.ok(body.supabase.note, 'supabase has note');

    if (body.pgExtra) {
      t.equal(body.pgExtra.status, 'unknown');
    }
    if (body.oracle) {
      t.equal(body.oracle.status, 'unknown');
    }

    // Counts should still be numbers (zeros)
    t.type(body.counts.workspaces, 'number');
    t.type(body.counts.projects, 'number');

    // Restore env vars
    if (originalSupabase) process.env.SUPABASE_DATABASE_URL = originalSupabase;
    if (originalPgExtra) process.env.PG_EXTRA_DATABASE_URL = originalPgExtra;
    if (originalOracle) process.env.ORACLE_CONNECT_STRING = originalOracle;
  });

  await t.test('GET /admin/db/stats - includes latency when connection succeeds', async (t) => {
    process.env.DEV_AUTH_BYPASS = 'true';

    // Only test if a DSN is configured
    if (!process.env.SUPABASE_DATABASE_URL && !process.env.PG_EXTRA_DATABASE_URL) {
      t.pass('No database DSN configured for latency test - skipping');
      return;
    }

    const response = await app.inject({
      method: 'GET',
      url: '/admin/db/stats',
    });

    t.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);

    // If connection is ok, should have latencyMs
    if (body.supabase.status === 'ok') {
      t.type(body.supabase.latencyMs, 'number', 'supabase has latencyMs when ok');
      t.ok(body.supabase.latencyMs >= 0, 'latency is non-negative');
    }

    if (body.pgExtra && body.pgExtra.status === 'ok') {
      t.type(body.pgExtra.latencyMs, 'number', 'pgExtra has latencyMs when ok');
      t.ok(body.pgExtra.latencyMs >= 0, 'latency is non-negative');
    }
  });

  await t.test(
    'GET /admin/db/stats - returns zeros for entity counts (not yet implemented)',
    async (t) => {
      process.env.DEV_AUTH_BYPASS = 'true';

      const response = await app.inject({
        method: 'GET',
        url: '/admin/db/stats',
      });

      t.equal(response.statusCode, 200);
      const body = JSON.parse(response.payload);

      // All counts should be 0 until real service integration
      t.equal(body.counts.workspaces, 0, 'workspaces is 0');
      t.equal(body.counts.projects, 0, 'projects is 0');
      t.equal(body.counts.boms, 0, 'boms is 0');
      t.equal(body.counts.orders, 0, 'orders is 0');
      t.equal(body.counts.users, 0, 'users is 0');
    },
  );
});
