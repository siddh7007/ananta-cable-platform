/**
 * Centralized error codes for the cable platform
 * Used across all services for consistent error handling
 */
export var ErrorCode;
(function (ErrorCode) {
    // Client errors (4xx)
    ErrorCode["BAD_REQUEST"] = "bad_request";
    ErrorCode["UNAUTHORIZED"] = "unauthorized";
    ErrorCode["FORBIDDEN"] = "forbidden";
    ErrorCode["NOT_FOUND"] = "not_found";
    ErrorCode["CONFLICT"] = "conflict";
    ErrorCode["UNPROCESSABLE_ENTITY"] = "unprocessable_entity";
    ErrorCode["RATE_LIMITED"] = "rate_limited";
    // Server errors (5xx)
    ErrorCode["INTERNAL_SERVER_ERROR"] = "internal_server_error";
    ErrorCode["NOT_IMPLEMENTED"] = "not_implemented";
    ErrorCode["BAD_GATEWAY"] = "bad_gateway";
    ErrorCode["SERVICE_UNAVAILABLE"] = "service_unavailable";
    ErrorCode["GATEWAY_TIMEOUT"] = "gateway_timeout";
    ErrorCode["UPSTREAM_UNAVAILABLE"] = "upstream_unavailable";
    // Custom application errors
    ErrorCode["VALIDATION_ERROR"] = "validation_error";
    ErrorCode["DATABASE_ERROR"] = "database_error";
    ErrorCode["EXTERNAL_API_ERROR"] = "external_api_error";
    ErrorCode["CONFIGURATION_ERROR"] = "configuration_error";
})(ErrorCode || (ErrorCode = {}));
