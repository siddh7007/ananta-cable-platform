import { writable } from 'svelte/store';

/**
 * Toast notification interface
 */
export interface Toast {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  requestId?: string;
  timestamp: number;
  duration?: number; // Auto-dismiss after this many ms
}

/**
 * Writable store for toast notifications
 */
export const toasts = writable<Toast[]>([]);

/**
 * Add a new toast notification
 */
export function addToast(toast: Omit<Toast, 'id' | 'timestamp'>): string {
  const id = crypto.randomUUID();
  const newToast: Toast = {
    ...toast,
    id,
    timestamp: Date.now()
  };

  toasts.update(current => [...current, newToast]);

  // Auto-dismiss after duration if specified
  if (toast.duration) {
    setTimeout(() => {
      removeToast(id);
    }, toast.duration);
  }

  return id;
}

/**
 * Remove a toast notification by ID
 */
export function removeToast(id: string): void {
  toasts.update(current => current.filter(toast => toast.id !== id));
}

/**
 * Clear all toast notifications
 */
export function clearToasts(): void {
  toasts.set([]);
}

/**
 * Helper to add an API error toast
 */
export function addApiErrorToast(error: string, requestId?: string): string {
  return addToast({
    type: 'error',
    title: 'API Error',
    message: error,
    requestId,
    duration: 10000 // 10 seconds for errors
  });
}

/**
 * Helper to add a success toast
 */
export function addSuccessToast(message: string, title = 'Success'): string {
  return addToast({
    type: 'success',
    title,
    message,
    duration: 5000 // 5 seconds for success
  });
}