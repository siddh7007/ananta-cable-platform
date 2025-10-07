import { OpenAPI } from '@cable-platform/client-sdk';

// Configure SDK with base URL
const BASE_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

OpenAPI.BASE = BASE_URL;

// Browser-compatible UUID generation
function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Unified result type
export type ApiResponse<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; error: string; status: number; details?: unknown; requestId: string };

// Helper to extract request ID from SDK error or response
function extractRequestId(error: unknown): string {
  // Try to get from error response headers
  const err = error as { response?: { headers?: Record<string, string> }; config?: { headers?: Record<string, string> } };
  if (err?.response?.headers?.['x-request-id']) {
    return err.response.headers['x-request-id'];
  }
  // Try to get from error config headers
  if (err?.config?.headers?.['x-request-id']) {
    return err.config.headers['x-request-id'];
  }
  // Fallback to generating new ID
  return randomUUID();
}

// Wrapper to convert SDK results to unified format
export async function wrapSdkCall<T>(
  sdkPromise: Promise<T>,
  requestId?: string
): Promise<ApiResponse<T>> {
  try {
    const data = await sdkPromise;
    return {
      ok: true,
      data,
      requestId: requestId || randomUUID()
    };
  } catch (error: unknown) {
    const reqId = extractRequestId(error);
    const err = error as { message?: string; response?: { status?: number; data?: unknown } };
    return {
      ok: false,
      error: err.message || 'Request failed',
      status: err.response?.status || 500,
      details: err.response?.data,
      requestId: reqId
    };
  }
}