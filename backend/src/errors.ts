/**
 * Error handling primitives.
 *
 * Every failure leaves the API in exactly one shape:
 *   { error: { code, message, details? } }
 * That lets the client branch on `code` instead of parsing prose, and it keeps
 * stack traces and SQL text out of responses.
 */

export type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL';

export type ErrorDetail = {
  /** Dotted path to the offending field, e.g. `title` or `msg`. */
  field?: string;
  message: string;
};

export type ApiErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
};

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  INTERNAL: 500,
};

/**
 * An error the HTTP layer is allowed to send to the client. Anything else that
 * escapes a handler is treated as an unexpected failure and reported as a
 * generic 500, so internal details never leak.
 */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly details?: ErrorDetail[];

  constructor(code: ErrorCode, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    // `details` is omitted entirely when empty so the response stays tidy.
    if (details && details.length > 0) {
      this.details = details;
    }
  }

  get status(): number {
    return STATUS_BY_CODE[this.code];
  }

  toBody(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }

  static validation(details: ErrorDetail[], message = 'Request validation failed'): ApiError {
    return new ApiError('VALIDATION_ERROR', message, details);
  }

  static notFound(message = 'Ticket not found'): ApiError {
    return new ApiError('NOT_FOUND', message);
  }
}
