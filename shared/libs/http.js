/**
 * HTTP utility library for Node.js 20+ fetch with timeout, retries, and typed responses
 */
export class HttpError extends Error {
    status;
    statusText;
    response;
    constructor(message, status, statusText, response) {
        super(message);
        this.status = status;
        this.statusText = statusText;
        this.response = response;
        this.name = 'HttpError';
    }
}
/**
 * Default HTTP client with timeout, retries, and JSON handling
 */
export class HttpClient {
    defaultOptions;
    constructor(options = {}) {
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
    async request(url, method = 'GET', options = {}) {
        const { timeout = this.defaultOptions.timeout, retries = this.defaultOptions.retries, retryDelay = this.defaultOptions.retryDelay, headers = {}, body, fetch: customFetch = this.defaultOptions.fetch, } = options;
        // Default JSON headers
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...headers,
        };
        // Prepare request body
        let requestBody;
        if (body !== undefined) {
            if (typeof body === 'string') {
                requestBody = body;
            }
            else {
                requestBody = JSON.stringify(body);
            }
        }
        const requestOptions = {
            method,
            headers: defaultHeaders,
            body: requestBody,
        };
        let lastError;
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
                let data;
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    data = await response.json();
                }
                else {
                    data = (await response.text());
                }
                // Convert headers to plain object
                const responseHeaders = {};
                response.headers.forEach((value, key) => {
                    responseHeaders[key] = value;
                });
                const httpResponse = {
                    status: response.status,
                    statusText: response.statusText,
                    headers: responseHeaders,
                    data,
                    response,
                };
                // Throw error for non-2xx responses
                if (!response.ok) {
                    throw new HttpError(`HTTP ${response.status}: ${response.statusText}`, response.status, response.statusText, response);
                }
                return httpResponse;
            }
            catch (error) {
                lastError = error;
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
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }
        // If we get here, all retries failed
        if (lastError instanceof HttpError) {
            throw lastError;
        }
        throw new Error(`Request failed after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
    }
    /**
     * GET request
     */
    async get(url, options = {}) {
        return this.request(url, 'GET', options);
    }
    /**
     * POST request
     */
    async post(url, body, options = {}) {
        return this.request(url, 'POST', { ...options, body });
    }
    /**
     * PUT request
     */
    async put(url, body, options = {}) {
        return this.request(url, 'PUT', { ...options, body });
    }
    /**
     * PATCH request
     */
    async patch(url, body, options = {}) {
        return this.request(url, 'PATCH', { ...options, body });
    }
    /**
     * DELETE request
     */
    async delete(url, options = {}) {
        return this.request(url, 'DELETE', options);
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
    get: (url, options) => httpClient.get(url, options),
    post: (url, body, options) => httpClient.post(url, body, options),
    put: (url, body, options) => httpClient.put(url, body, options),
    patch: (url, body, options) => httpClient.patch(url, body, options),
    delete: (url, options) => httpClient.delete(url, options),
};
