import { Client } from 'pg';
import { fetchWithTimeout } from './http.js';

export interface HealthCheckResult {
  name: string;
  status: 'ok' | 'fail' | 'skipped';
  latency_ms: number;
  error?: string;
}

export async function checkDRC(): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const response = await fetchWithTimeout('http://drc:8000/health', {}, 2000);

    if (!response.ok) {
      return {
        name: 'drc',
        status: 'fail',
        latency_ms: Date.now() - start,
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    if (data.status !== 'ok') {
      return {
        name: 'drc',
        status: 'fail',
        latency_ms: Date.now() - start,
        error: 'Service reported non-ok status'
      };
    }

    return {
      name: 'drc',
      status: 'ok',
      latency_ms: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'drc',
      status: 'fail',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkPostgres(urlEnv: string, name: string): Promise<HealthCheckResult> {
  const start = Date.now();
  const url = process.env[urlEnv];

  if (!url) {
    return {
      name,
      status: 'skipped',
      latency_ms: 0
    };
  }

  const client = new Client({ connectionString: url });

  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();

    return {
      name,
      status: 'ok',
      latency_ms: Date.now() - start
    };
  } catch (error) {
    try {
      await client.end();
    } catch {
      // Ignore cleanup errors
    }

    return {
      name,
      status: 'fail',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkOracle(): Promise<HealthCheckResult> {
  const start = Date.now();

  // Check if oracledb package is available
  try {
    await import('oracledb');
  } catch {
    return {
      name: 'oracle',
      status: 'skipped',
      latency_ms: 0
    };
  }

  const connectString = process.env.ORACLE_CONNECT_STRING;
  if (!connectString) {
    return {
      name: 'oracle',
      status: 'skipped',
      latency_ms: 0
    };
  }

  try {
    const oracledb = await import('oracledb');
    const connection = await oracledb.default.getConnection({
      connectString,
      user: process.env.ORACLE_APP_USER || 'app',
      password: process.env.ORACLE_APP_PASSWORD || 'app'
    });

    await connection.execute('SELECT 1 FROM dual');
    await connection.close();

    return {
      name: 'oracle',
      status: 'ok',
      latency_ms: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'oracle',
      status: 'fail',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function runReadinessChecks(): Promise<{
  status: 'ok' | 'degraded' | 'fail';
  checks: HealthCheckResult[];
}> {
  const checks: HealthCheckResult[] = [];

  // Run all checks in parallel
  const checkPromises = [
    checkDRC(),
    checkPostgres('SUPABASE_DATABASE_URL', 'postgres_supabase'),
    checkPostgres('PG_EXTRA_DATABASE_URL', 'postgres_extra'),
    checkOracle()
  ];

  const results = await Promise.all(checkPromises);
  checks.push(...results);

  // Determine overall status - all are optional, so only fail if all fail
  const activeChecks = checks.filter(c => c.status !== 'skipped');
  const failedChecks = activeChecks.filter(c => c.status === 'fail');

  let status: 'ok' | 'degraded' | 'fail' = 'ok';
  if (failedChecks.length > 0) {
    // Since all dependencies are optional, we use 'degraded' for any failures
    status = 'degraded';
  }

  return { status, checks };
}