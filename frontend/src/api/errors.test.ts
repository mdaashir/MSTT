import { describe, expect, it } from 'vitest';
import { ApiClientError, toApiError } from './errors.js';

/**
 * Error mapping.
 *
 * The value of these tests is the contract: whatever the server sends, the UI
 * must end up with one typed error, a field-keyed map, and a sane retry hint.
 */

const jsonResponse = (body: unknown, status = 400) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('toApiError', () => {
  it('maps a validation response and keeps the details', async () => {
    const error = await toApiError(
      jsonResponse({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: [{ field: 'title', message: 'Title cannot be empty' }],
        },
      }),
    );

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Request validation failed');
    expect(error.fieldErrors).toEqual({ title: 'Title cannot be empty' });
    expect(error.isRetryable).toBe(false);
  });

  it('maps not found and marks it non-retryable', async () => {
    const error = await toApiError(
      jsonResponse({ error: { code: 'NOT_FOUND', message: 'Ticket 5 not found' } }, 404),
    );

    expect(error.code).toBe('NOT_FOUND');
    expect(error.isRetryable).toBe(false);
  });

  it('maps an internal error and marks it retryable', async () => {
    const error = await toApiError(
      jsonResponse({ error: { code: 'INTERNAL', message: 'Something went wrong' } }, 500),
    );

    expect(error.code).toBe('INTERNAL');
    expect(error.isRetryable).toBe(true);
  });

  it('falls back to a generic error for a non-JSON body', async () => {
    const error = await toApiError(new Response('<html>502 Bad Gateway</html>', { status: 502 }));

    expect(error.code).toBe('INTERNAL');
    expect(error.message).toContain('502');
  });

  it('falls back when the body has an unexpected shape', async () => {
    const error = await toApiError(jsonResponse({ unexpected: true }, 400));

    expect(error.code).toBe('INTERNAL');
  });

  it('keeps only the first message per field', async () => {
    const error = await toApiError(
      jsonResponse({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'bad',
          details: [
            { field: 'title', message: 'first' },
            { field: 'title', message: 'second' },
            { message: 'no field' },
          ],
        },
      }),
    );

    expect(error.fieldErrors).toEqual({ title: 'first' });
  });
});
