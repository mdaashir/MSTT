import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ApiError } from '../errors.js';

/**
 * Centralised error handling.
 *
 * Handlers are allowed to `throw`; this is the single place that turns a thrown
 * value into a response. Known `ApiError`s keep their code and status, anything
 * else becomes a generic 500 with no stack trace in the body. The real error is
 * logged server-side so it is still debuggable.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.status).json(error.toBody());
    return;
  }

  // Log the original error, send only the generic contract details.
  console.error('[api] unexpected error:', error);
  res.status(500).json({
    error: { code: 'INTERNAL', message: 'Something went wrong' },
  });
};

/** Unknown route -> same error shape as everything else, not Express' HTML page. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
};

/**
 * Force JSON bodies to be objects.
 *
 * `express.json()` happily parses `[]` or `"text"`, which would reach the zod
 * schema as a non-object. Rejecting it here keeps the schema messages clear.
 */
export const requireJsonObject: RequestHandler = (req, _res, next) => {
  const body: unknown = req.body;
  if (body === undefined || typeof body !== 'object' || body === null || Array.isArray(body)) {
    next(ApiError.validation([{ message: 'Request body must be a JSON object' }]));
    return;
  }
  next();
};
