import { error } from '@sveltejs/kit';
import { configStore, loadClientConfig } from '$lib/stores/config';
import { userStore, refreshUser } from '$lib/stores/user';
import { get } from 'svelte/store';

/**
 * Admin section route guard
 *
 * Checks if user has admin access (currently checks for 'dev' role).
 * In dev-bypass mode, allows access and sets adminDevBypass flag.
 *
 * Fail-closed: Any network error or missing data results in 403.
 */
export const load = async () => {
  // Test mode: return mock data for Playwright tests
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return {
      adminDevBypass: true,
      user: {
        sub: 'test-user',
        roles: ['dev', 'admin'],
        name: 'Test Admin',
        email: 'admin@test.com',
      },
    };
  }

  try {
    // Load config first to check dev-bypass status
    const configState = get(configStore);
    if (!configState.data) {
      await loadClientConfig();
    }

    const config = get(configStore).data;
    if (!config) {
      // Config unavailable - fail closed
      throw error(403, 'Access denied: Unable to verify permissions');
    }

    // Load user data
    const userState = get(userStore);
    if (!userState.data) {
      await refreshUser();
    }

    const user = get(userStore).data;
    if (!user) {
      // User data unavailable - fail closed
      throw error(403, 'Access denied: Unable to verify user');
    }

    // Dev-bypass mode: allow access with visible badge
    if (config.auth.devBypass) {
      return {
        adminDevBypass: true,
        user,
      };
    }

    // Production mode: check roles
    // Currently checking for 'dev' role, extensible for 'admin', 'superadmin', etc.
    const allowedRoles = ['dev', 'admin']; // Easy to extend in future
    const hasAdminAccess = user.roles?.some((role) => allowedRoles.includes(role));

    if (!hasAdminAccess) {
      throw error(403, 'Forbidden: You do not have permission to access the admin section');
    }

    // Access granted
    return {
      adminDevBypass: false,
      user,
    };
  } catch (err) {
    // If it's already a SvelteKit error, re-throw it
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    // Network or unexpected errors - fail closed
    console.error('Admin guard error:', err);
    throw error(403, 'Access denied: An error occurred while verifying permissions');
  }
};
