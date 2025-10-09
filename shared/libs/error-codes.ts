/**
 * Centralized error codes for the cable platform
 * Used across all services for consistent error handling
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'bad_request',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  UNPROCESSABLE_ENTITY = 'unprocessable_entity',
  RATE_LIMITED = 'rate_limited',

  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  NOT_IMPLEMENTED = 'not_implemented',
  BAD_GATEWAY = 'bad_gateway',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  GATEWAY_TIMEOUT = 'gateway_timeout',
  UPSTREAM_UNAVAILABLE = 'upstream_unavailable',

  // Custom application errors
  VALIDATION_ERROR = 'validation_error',
  DATABASE_ERROR = 'database_error',
  EXTERNAL_API_ERROR = 'external_api_error',
  CONFIGURATION_ERROR = 'configuration_error',
}
