/**
 * HTTP utility library for Node.js 20+ fetch with timeout, retries, and typed responses
 */

export interface HttpRequestOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Additional headers to merge with defaults */
  headers?: Record<string, string>;
  /** Request body for POST/PUT/PATCH */
  body?: unknown;
  /** Custom fetch implementation (for testing) */
  fetch?: typeof fetch;
}

export interface HttpResponse<T = unknown> {
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Parsed response data */
  data: T;
  /** Raw response object */
  response: Response;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public response?: Response,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Default HTTP client with timeout, retries, and JSON handling
 */
export class HttpClient {
  private defaultOptions: Required<
    Pick<HttpRequestOptions, 'timeout' | 'retries' | 'retryDelay' | 'fetch'>
  >;

  constructor(
    options: {
      timeout?: number;
      retries?: number;
      retryDelay?: number;
      fetch?: typeof fetch;
    } = {},
  ) {
    this.defaultOptions = {
      timeout: options.timeout ?? 30000, // 30 seconds
      retries: options.retries ?? 3,
      retryDelay: options.retryDelay ?? 1000, // 1 second
      fetch: options.fetch ?? fetch,
    };
  }

  /**
   * Make an HTTP request with timeout and retry logic
   */
  async request<T = unknown>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    const {
      timeout = this.defaultOptions.timeout,
      retries = this.defaultOptions.retries,
      retryDelay = this.defaultOptions.retryDelay,
      headers = {},
      body,
      fetch: customFetch = this.defaultOptions.fetch,
    } = options;

    // Default JSON headers
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    };

    // Prepare request body
    let requestBody: string | undefined;
    if (body !== undefined) {
      if (typeof body === 'string') {
        requestBody = body;
      } else {
        requestBody = JSON.stringify(body);
      }
    }

    const requestOptions: RequestInit = {
      method,
      headers: defaultHeaders,
      body: requestBody,
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await customFetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response based on content type
        let data: T;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as T;
        }

        // Convert headers to plain object
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const httpResponse: HttpResponse<T> = {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          data,
          response,
        };

        // Throw error for non-2xx responses
        if (!response.ok) {
          throw new HttpError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response.statusText,
            response,
          );
        }

        return httpResponse;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on the last attempt
        if (attempt === retries) {
          break;
        }

        // Don't retry on certain errors
        if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
          // Client errors (4xx) - don't retry
          break;
        }

        // Don't retry on AbortError (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          break;
        }

        // Wait before retrying
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    // If we get here, all retries failed
    if (lastError instanceof HttpError) {
      throw lastError;
    }

    throw new Error(
      `Request failed after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`,
    );
  }

  /**
   * GET request
   */
  async get<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, 'GET', options);
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    url: string,
    body?: unknown,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, 'POST', { ...options, body });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    url: string,
    body?: unknown,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, 'PUT', { ...options, body });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    url: string,
    body?: unknown,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, 'PATCH', { ...options, body });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    url: string,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, 'DELETE', options);
  }
}

/**
 * Default HTTP client instance
 */
export const httpClient = new HttpClient();

/**
 * Convenience functions using the default client
 */
export const http = {
  get: <T = unknown>(url: string, options?: HttpRequestOptions) => httpClient.get<T>(url, options),
  post: <T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions) =>
    httpClient.post<T>(url, body, options),
  put: <T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions) =>
    httpClient.put<T>(url, body, options),
  patch: <T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions) =>
    httpClient.patch<T>(url, body, options),
  delete: <T = unknown>(url: string, options?: HttpRequestOptions) =>
    httpClient.delete<T>(url, options),
};
