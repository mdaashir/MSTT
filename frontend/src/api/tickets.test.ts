import { afterEach, describe, expect, it, vi } from 'vitest';
import { ticketsApi } from './tickets.js';
import { ApiClientError } from './errors.js';

/**
 * API client wiring.
 *
 * `fetch` is stubbed at the boundary, so these tests check the two things that a
 * refactor can silently break: the URL and query string that get sent, and the
 * way a failed response is surfaced.
 */

/**
 * The arguments of the most recent `fetch` call.
 *
 * Throws instead of returning undefined: an empty call list means the test forgot
 * to stub `fetch`, and a clear failure message beats a vague type error.
 */
const lastCall = (): [RequestInfo | URL, RequestInit | undefined] => {
  const calls = vi.mocked(fetch).mock.calls;
  const call = calls[calls.length - 1];
  if (!call) {
    throw new Error('fetch was not called');
  }
  return [call[0], call[1]];
};

const jsonOk = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ticketsApi', () => {
  it('sends list filters, sort and pagination as query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonOk([]));
    vi.stubGlobal('fetch', fetchMock);

    await ticketsApi.list({ status: 'In Progress', q: 'printer', sort: 'oldest', limit: 20, offset: 40 });

    const [url] = lastCall();
    expect(url).toBe(
      '/api/tickets?status=In+Progress&q=printer&sort=oldest&limit=20&offset=40',
    );
  });

  it('omits unset params so the server defaults apply', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonOk([])));

    await ticketsApi.list();

    expect(lastCall()[0]).toBe('/api/tickets');
  });

  it('patches a single field with the right method and body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonOk({ id: 1 })));

    await ticketsApi.update(1, { status: 'Resolved' });

    const [url, init] = lastCall();
    expect(url).toBe('/api/tickets/1');
    expect(init?.method).toBe('PATCH');
    expect(init?.body).toBe(JSON.stringify({ status: 'Resolved' }));
  });

  it('resolves without parsing a body on 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(ticketsApi.delete(7)).resolves.toBeUndefined();
    expect(lastCall()[1]?.method).toBe('DELETE');
  });

  it('turns a failed response into a typed error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'bad', details: [] } }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    await expect(ticketsApi.create({ title: '', description: '', priority: 'Low' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('turns a network failure into a retryable NETWORK error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const caught = await ticketsApi.list().catch((error: unknown) => error);
    expect(caught).toBeInstanceOf(ApiClientError);
    expect((caught as ApiClientError).code).toBe('NETWORK');
    expect((caught as ApiClientError).isRetryable).toBe(true);
  });
});
