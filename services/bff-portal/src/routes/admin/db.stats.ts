import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import postgres from 'postgres';
import { adminGuard } from '../../lib/adminGuard.js';

interface DbConnectionStatus {
  status: 'ok' | 'fail' | 'unknown';
  latencyMs?: number;
  note?: string;
}

interface DbStats {
  supabase: DbConnectionStatus;
  pgExtra?: DbConnectionStatus;
  oracle?: DbConnectionStatus;
  counts: {
    workspaces: number;
    projects: number;
    boms: number;
    orders: number;
    users: number;
  };
  ts: string;
}

/**
 * Check database connection health with a fast ping
 * @param connectionString Database connection string
 * @param timeout Timeout in milliseconds (default: 500ms)
 * @returns Connection status with latency
 */
async function checkDbConnection(
  connectionString: string,
  timeout: number = 500,
): Promise<DbConnectionStatus> {
  const startTime = Date.now();
  let sql: ReturnType<typeof postgres> | null = null;

  try {
    sql = postgres(connectionString, {
      max: 1,
      idle_timeout: 1,
      connect_timeout: Math.floor(timeout / 1000), // Convert to seconds
    });

    // Simple ping query with timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), timeout),
    );

    await Promise.race([sql`SELECT 1 as ping`, timeoutPromise]);

    const latencyMs = Date.now() - startTime;

    return {
      status: 'ok',
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    return {
      status: 'fail',
      latencyMs,
      note: error instanceof Error ? error.message : 'Connection failed',
    };
  } finally {
    // Clean up connection
    if (sql) {
      try {
        await sql.end({ timeout: 1 });
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Admin DB stats routes
 * Provides read-only database health and entity counts
 */
export async function adminDbStatsRoutes(fastify: FastifyInstance) {
  // GET /admin/db/stats - Get database statistics
  fastify.get(
    '/admin/db/stats',
    {
      preHandler: adminGuard,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = request.id;

      try {
        // Initialize response
        const stats: DbStats = {
          supabase: {
            status: 'unknown',
            note: 'not_configured',
          },
          counts: {
            workspaces: 0,
            projects: 0,
            boms: 0,
            orders: 0,
            users: 0,
          },
          ts: new Date().toISOString(),
        };

        // Check Supabase connection
        const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
        if (supabaseUrl) {
          stats.supabase = await checkDbConnection(supabaseUrl);
        }

        // Check PG Extra connection (optional)
        const pgExtraUrl = process.env.PG_EXTRA_DATABASE_URL;
        if (pgExtraUrl) {
          stats.pgExtra = await checkDbConnection(pgExtraUrl);
        } else {
          stats.pgExtra = {
            status: 'unknown',
            note: 'not_configured',
          };
        }

        // Check Oracle connection (optional - no driver available)
        const oracleConnectString = process.env.ORACLE_CONNECT_STRING;
        if (oracleConnectString) {
          stats.oracle = {
            status: 'unknown',
            note: 'no_driver',
          };
        } else {
          stats.oracle = {
            status: 'unknown',
            note: 'not_configured',
          };
        }

        // Entity counts - all return 0 with note until real services are integrated
        // TODO: Integrate with real service endpoints when available:
        // - projects service for workspaces/projects/boms
        // - orders service for orders
        // - auth/user store for users
        stats.counts = {
          workspaces: 0,
          projects: 0,
          boms: 0,
          orders: 0,
          users: 0,
        };

        // Set response headers
        reply.header('content-type', 'application/json');
        reply.header('x-request-id', requestId);

        return stats;
      } catch (error) {
        console.error('Error fetching DB stats:', error);

        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch database statistics',
        });
      }
    },
  );
}
