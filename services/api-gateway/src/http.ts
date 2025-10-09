export class HttpError extends Error {
  status: number;
  statusText: string;

  constructor(status: number, statusText: string, message: string) {
    super(message);
    this.status = status;
    this.statusText = statusText;
    this.name = 'HttpError';
  }
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new HttpError(408, 'Request Timeout', `Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

export interface RetryResult {
  response: Response;
  retryCount: number;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 1,
  timeoutMs: number = 5000,
  baseBackoffMs: number = 1000
): Promise<RetryResult> {
  let lastError: Error;
  let retryCount = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        return { response, retryCount };
      }

      // Retry on 5xx errors or network issues
      if (response.status >= 500) {
        if (attempt < maxRetries) {
          retryCount++;
          // Jittered exponential backoff: baseBackoffMs * 2^attempt + random jitter
          const backoffMs = baseBackoffMs * Math.pow(2, attempt) + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        return { response, retryCount };
      }

      return { response, retryCount };
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors or the last attempt
      if (attempt >= maxRetries) {
        throw lastError;
      }

      // Retry on timeout or network errors with jittered backoff
      retryCount++;
      const backoffMs = baseBackoffMs * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError!;
}