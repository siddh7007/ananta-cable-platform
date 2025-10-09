import { ErrorCode } from '../../../shared/libs/error-codes.js';

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(code: string, status: number, msg?: string, details?: unknown) {
    super(msg || code);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class BadRequest extends HttpError {
  constructor(msg = 'bad request', details?: unknown) {
    super(ErrorCode.BAD_REQUEST, 400, msg, details);
  }
}

export class Unauthorized extends HttpError {
  constructor(msg = 'unauthorized') {
    super(ErrorCode.UNAUTHORIZED, 401, msg);
  }
}

export class Forbidden extends HttpError {
  constructor(msg = 'forbidden') {
    super(ErrorCode.FORBIDDEN, 403, msg);
  }
}

export class NotFound extends HttpError {
  constructor(msg = 'not found') {
    super(ErrorCode.NOT_FOUND, 404, msg);
  }
}

export class Conflict extends HttpError {
  constructor(msg = 'conflict', details?: unknown) {
    super(ErrorCode.CONFLICT, 409, msg, details);
  }
}

export class RateLimited extends HttpError {
  constructor(retryMs?: number) {
    super(ErrorCode.RATE_LIMITED, 429, 'rate limited', retryMs ? { retry_after_ms: retryMs } : undefined);
  }
}

export class UpstreamUnavailable extends HttpError {
  constructor(msg = 'upstream unavailable') {
    super(ErrorCode.UPSTREAM_UNAVAILABLE, 502, msg);
  }
}

export class UpstreamInvalidPayload extends HttpError {
  constructor() {
    super('upstream_invalid_payload', 502, 'upstream returned invalid payload');
  }
}

export class UpstreamBadRequest extends HttpError {
  constructor() {
    super('upstream_bad_request', 502, 'upstream rejected request');
  }
}

export class Internal extends HttpError {
  constructor(msg = 'internal') {
    super('internal', 500, msg);
  }
}

export class UnsupportedMediaType extends HttpError {
  constructor(msg = 'unsupported media type') {
    super('unsupported_media_type', 415, msg);
  }
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

export function toResponse(err: unknown): { status: number; body: ErrorResponse } {
  if (err instanceof HttpError) {
    return {
      status: err.status,
      body: {
        error: err.code,
        message: err.message,
        details: err.details
      }
    };
  }

  // Handle unknown errors
  console.error('Unhandled error:', err);
  const internal = new Internal();
  return {
    status: internal.status,
    body: {
      error: internal.code,
      message: internal.message,
      details: err instanceof Error ? { original_message: err.message } : undefined
    }
  };
}