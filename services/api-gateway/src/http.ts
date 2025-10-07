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

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 1,
  timeoutMs: number = 5000
): Promise<Response> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Retry on 5xx errors or network issues
      if (response.status >= 500) {
        if (attempt < maxRetries) {
          continue;
        }
        return response;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors or the last attempt
      if (attempt >= maxRetries) {
        throw lastError;
      }
    }
  }

  throw lastError!;
}