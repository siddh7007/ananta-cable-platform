import { writable } from 'svelte/store';

/**
 * Client configuration interface
 */
export interface ClientConfig {
  env: 'development' | 'staging' | 'production' | string;
  apiBaseUrl: string;
  auth: { domain: string | null; audience: string | null; devBypass: boolean };
  features: { otel: boolean; flags: string[] };
}

/**
 * Config store state interface
 */
export interface ConfigState {
  loading: boolean;
  data?: ClientConfig;
  error?: string;
  requestId?: string;
}

/**
 * Writable store for client configuration
 */
export const configStore = writable<ConfigState>({
  loading: false
});

/**
 * Loads client configuration from the API
 * Note: Currently uses direct fetch since API client doesn't expose getConfig()
 * TODO: Consider adding getConfig() to API client or confirm endpoint usage
 */
export async function loadClientConfig(): Promise<void> {
  configStore.update(state => ({ ...state, loading: true }));

  try {
    // Use the same base URL as the API client
    const baseUrl = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL || 'http://localhost:8080';

    const response = await fetch(`${baseUrl}/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add request ID header if needed
        'x-request-id': crypto.randomUUID()
      }
    });

    const requestId = response.headers.get('x-request-id') || crypto.randomUUID();

    if (response.ok) {
      const data: ClientConfig = await response.json();
      configStore.update(state => ({
        ...state,
        loading: false,
        data,
        error: undefined,
        requestId
      }));
    } else {
      configStore.update(state => ({
        ...state,
        loading: false,
        error: `Failed to load config: ${response.status}`,
        requestId
      }));
    }
  } catch (error) {
    configStore.update(state => ({
      ...state,
      loading: false,
      error: 'Config unavailable'
    }));
  }
}