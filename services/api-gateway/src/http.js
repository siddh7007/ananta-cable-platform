// Re-export shared HTTP utilities for backward compatibility
export { HttpClient, HttpError, httpClient, http } from '../../../shared/libs/http.js';
// Legacy exports for backward compatibility
export { HttpError as default } from '../../../shared/libs/http.js';
// Import for internal use
import { httpClient, HttpError } from '../../../shared/libs/http.js';
// Legacy function for backward compatibility - maps to new HTTP client
export async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    const response = await httpClient.request(url, options.method || 'GET', {
        timeout: timeoutMs,
        headers: options.headers,
        body: options.body,
        retries: 0, // No retries for timeout-only function
    });
    return response.response;
}
// Legacy function for backward compatibility - maps to new HTTP client
export async function fetchWithRetry(url, options = {}, maxRetries = 1, timeoutMs = 5000, baseBackoffMs = 1000) {
    try {
        const response = await httpClient.request(url, options.method || 'GET', {
            timeout: timeoutMs,
            headers: options.headers,
            body: options.body,
            retries: maxRetries,
            retryDelay: baseBackoffMs,
        });
        return { response: response.response, retryCount: 0 }; // retryCount not tracked in new implementation
    }
    catch (error) {
        if (error instanceof HttpError) {
            // For backward compatibility, return response even on error if it exists
            if (error.response) {
                return { response: error.response, retryCount: maxRetries };
            }
        }
        throw error;
    }
}
