import { writable } from 'svelte/store';
import { api } from '../api/client';

/**
 * User information interface
 */
export interface UserInfo {
  sub: string;
  roles?: string[];
  features?: string[];
}

/**
 * User store state interface
 */
export interface UserState {
  loading: boolean;
  data?: UserInfo;
  error?: string;
  requestId?: string;
  lastFetchedAt?: number;
}

/**
 * Writable store for user authentication state
 */
export const userStore = writable<UserState>({
  loading: false
});

/**
 * Refreshes user information from the API
 * Sets loading state and updates store with result or error
 */
export async function refreshUser(): Promise<void> {
  userStore.update(state => ({ ...state, loading: true }));

  try {
    const result = await api.getMe();

    if (result.ok) {
      userStore.update(state => ({
        ...state,
        loading: false,
        data: result.data,
        error: undefined,
        requestId: result.requestId,
        lastFetchedAt: Date.now()
      }));
    } else {
      // Handle 401 unauthorized vs other errors
      const error = result.status === 401 ? 'unauthorized' : 'unavailable';
      userStore.update(state => ({
        ...state,
        loading: false,
        data: undefined,
        error,
        requestId: result.requestId
      }));
    }
  } catch (error) {
    // Network or other unexpected errors
    userStore.update(state => ({
      ...state,
      loading: false,
      data: undefined,
      error: 'unavailable'
    }));
  }
}

/**
 * Clears user data and resets to initial state
 */
export function clearUser(): void {
  userStore.set({ loading: false });
}