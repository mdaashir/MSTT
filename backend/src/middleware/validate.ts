import type { ErrorDetail } from '../errors.js';
import { ApiError } from '../errors.js';
import type { ZodType } from 'zod';

/**
 * Schema-driven request validation.
 *
 * Wraps the awkward zod issues into the single error shape. `path` becomes a
 * dotted `field` so the UI can attach the message to the right input without
 * knowing anything about zod's internals.
 */
export function parseOrThrow<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  const details: ErrorDetail[] = result.error.issues.map((issue) => ({
    field: issue.path.join('.') || undefined,
    message: issue.message,
  }));

  throw ApiError.validation(details);
}
