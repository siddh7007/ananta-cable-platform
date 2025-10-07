import { readable } from 'svelte/store';

/**
 * Route interface
 */
export interface Route {
  path: string;
  params: Record<string, string>;
}

/**
 * Parses hash string into path and params
 */
function parseHash(hash: string): Route {
  // Remove leading # and split on ?
  const [pathPart, queryPart] = hash.slice(1).split('?');

  // Default to '/' if empty
  const path = pathPart || '/';

  // Parse query params
  const params: Record<string, string> = {};
  if (queryPart) {
    const urlParams = new URLSearchParams(queryPart);
    for (const [key, value] of urlParams) {
      params[key] = value;
    }
  }

  return { path, params };
}

/**
 * Readable store for current route
 */
export const route = readable<Route>({ path: '/', params: {} }, (set) => {
  // Set initial route
  set(parseHash(window.location.hash));

  // Listen for hash changes
  const handleHashChange = () => {
    set(parseHash(window.location.hash));
  };

  window.addEventListener('hashchange', handleHashChange);

  // Cleanup
  return () => {
    window.removeEventListener('hashchange', handleHashChange);
  };
});

/**
 * Navigate to a new path
 */
export function navigate(path: string): void {
  window.location.hash = path;
}