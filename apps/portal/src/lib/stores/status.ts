import { writable } from 'svelte/store';
import { api } from '../api/client';

/**
 * API status interface
 */
export interface ApiStatus {
  loading: boolean;
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  requestId?: string;
  lastCheckedAt?: number;
}

/**
 * Writable store for API health status
 */
export const apiStatusStore = writable<ApiStatus>({
  loading: false,
  healthy: false
});

/**
 * Checks API health and measures latency
 * @param timeoutMs Timeout for the health check request
 */
export async function checkApiHealth(timeoutMs = 1500): Promise<void> {
  apiStatusStore.update(status => ({ ...status, loading: true }));

  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const result = await api.getHealth();

    clearTimeout(timeoutId);
    const latencyMs = performance.now() - startTime;

    if (result.ok) {
      apiStatusStore.update(status => ({
        ...status,
        loading: false,
        healthy: true,
        latencyMs: Math.round(latencyMs),
        error: undefined,
        requestId: result.requestId,
        lastCheckedAt: Date.now()
      }));
    } else {
      apiStatusStore.update(status => ({
        ...status,
        loading: false,
        healthy: false,
        error: 'unreachable',
        requestId: result.requestId
      }));
    }
  } catch (error) {
    apiStatusStore.update(status => ({
      ...status,
      loading: false,
      healthy: false,
      error: 'unreachable'
    }));
  }
}

/**
 * Starts a heartbeat that periodically checks API health
 * @param intervalMs Interval between health checks
 * @returns Function to stop the heartbeat
 */
export function startHeartbeat(intervalMs = 15000): () => void {
  // Initial check
  checkApiHealth();

  // Set up interval
  const intervalId = setInterval(() => {
    checkApiHealth();
  }, intervalMs);

  // Return disposer
  return () => {
    clearInterval(intervalId);
  };
}