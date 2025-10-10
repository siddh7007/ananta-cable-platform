/**
 * SSR load function for feature flags admin page
 * Fetches flags from BFF with safe error handling
 */

import type { Load } from '@sveltejs/kit';
import type { FeatureFlag } from '$lib/types/admin';

export const load: Load = async ({ url, fetch }) => {
  // Get query params with defaults
  const scope = (url.searchParams.get('scope') || 'org') as 'org' | 'workspace';
  const workspaceId = url.searchParams.get('workspaceId') || '';

  // Build API URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
  const params = new URLSearchParams({ scope });
  if (scope === 'workspace' && workspaceId) {
    params.append('workspaceId', workspaceId);
  }

  const apiUrl = `${apiBaseUrl}/admin/flags?${params.toString()}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': crypto.randomUUID(),
      },
    });

    const requestId = response.headers.get('x-request-id') || '';

    if (!response.ok) {
      console.error(`Failed to fetch feature flags: ${response.status}`);
      return {
        flags: [] as FeatureFlag[],
        scope,
        workspaceId,
        error: `Failed to load flags: HTTP ${response.status}`,
        requestId,
      };
    }

    const flags: FeatureFlag[] = await response.json();

    return {
      flags,
      scope,
      workspaceId,
      requestId,
    };
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return {
      flags: [] as FeatureFlag[],
      scope,
      workspaceId,
      error:
        error instanceof Error
          ? error.message
          : 'Network error loading feature flags',
    };
  }
};
