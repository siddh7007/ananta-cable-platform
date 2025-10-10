import type { Load } from '@sveltejs/kit';
import type { AdminDbData, DbStats } from '$lib/types/admin';

/**
 * Load database statistics for the admin DB dashboard
 * Calls the BFF API endpoint GET /admin/db/stats
 */
export const load: Load = async ({ fetch }): Promise<AdminDbData> => {
  try {
    // Get API base URL from environment (defaults to localhost for dev)
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

    const response = await fetch(`${apiBaseUrl}/admin/db/stats`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch database statistics:', response.status, errorText);

      return {
        error: `Failed to fetch database statistics (${response.status})`,
      };
    }

    const stats: DbStats = await response.json();
    return { stats };
  } catch (err) {
    console.error('Failed to load DB stats:', err);
    return {
      error: 'Failed to fetch database statistics',
    };
  }
};
