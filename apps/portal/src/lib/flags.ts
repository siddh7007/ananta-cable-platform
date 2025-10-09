/**
 * Feature Flag Utility
 *
 * Reads feature flags from environment variables and localStorage.
 * localStorage takes precedence over environment variables.
 *
 * Environment: VITE_FLAGS=csv,list,of,flags
 * localStorage: flags=csv,list,of,flags
 */

const FLAGS_ENV_KEY = 'VITE_FLAGS';
const FLAGS_STORAGE_KEY = 'flags';

/**
 * Parse CSV string into Set of flag names
 */
function parseFlags(csv: string | undefined): Set<string> {
  if (!csv || typeof csv !== 'string') {
    return new Set();
  }

  return new Set(
    csv
      .split(',')
      .map(flag => flag.trim())
      .filter(flag => flag.length > 0)
  );
}

/**
 * Get all enabled flags from environment and localStorage
 */
function getAllFlags(): Set<string> {
  // Get flags from environment (build-time)
  const envFlags = parseFlags(import.meta.env[FLAGS_ENV_KEY]);

  // Get flags from localStorage (runtime)
  const storageFlags = parseFlags(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(FLAGS_STORAGE_KEY) || undefined
      : undefined
  );

  // Merge with localStorage taking precedence
  return new Set([...envFlags, ...storageFlags]);
}

/**
 * Check if a feature flag is enabled
 *
 * @param name - The flag name to check
 * @returns true if the flag is enabled, false otherwise
 */
export function isFlagOn(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const flags = getAllFlags();
  return flags.has(name.trim());
}

/**
 * Enable a feature flag in localStorage
 *
 * @param name - The flag name to enable
 */
export function enableFlag(name: string): void {
  if (!name || typeof name !== 'string') {
    return;
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return;
  }

  // Get current flags from localStorage
  const currentCsv = localStorage.getItem(FLAGS_STORAGE_KEY) || '';
  const currentFlags = parseFlags(currentCsv);

  // Add the new flag
  currentFlags.add(trimmedName);

  // Save back to localStorage
  const updatedCsv = Array.from(currentFlags).join(',');
  localStorage.setItem(FLAGS_STORAGE_KEY, updatedCsv);
}

/**
 * Disable a feature flag in localStorage
 *
 * @param name - The flag name to disable
 */
export function disableFlag(name: string): void {
  if (!name || typeof name !== 'string') {
    return;
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return;
  }

  // Get current flags from localStorage
  const currentCsv = localStorage.getItem(FLAGS_STORAGE_KEY) || '';
  const currentFlags = parseFlags(currentCsv);

  // Remove the flag
  currentFlags.delete(trimmedName);

  // Save back to localStorage (or remove if empty)
  if (currentFlags.size > 0) {
    const updatedCsv = Array.from(currentFlags).join(',');
    localStorage.setItem(FLAGS_STORAGE_KEY, updatedCsv);
  } else {
    localStorage.removeItem(FLAGS_STORAGE_KEY);
  }
}

/**
 * Get all currently enabled flags (for debugging)
 *
 * @returns Set of all enabled flag names
 */
export function getEnabledFlags(): Set<string> {
  return getAllFlags();
}

/**
 * Clear all localStorage flags (reset to environment only)
 */
export function clearLocalFlags(): void {
  localStorage.removeItem(FLAGS_STORAGE_KEY);
}