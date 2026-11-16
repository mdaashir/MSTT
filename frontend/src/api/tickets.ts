import type { CreateTicketInput, ListTicketsQuery, Ticket, UpdateTicketInput } from '../types.js';
import { ApiClientError, toApiError } from './errors.js';

/**
 * The typed HTTP client.
 *
 * This is the only module in the app that calls `fetch`. Components use hooks
 * that use this client, which means the response mapping, the error mapping and
 * the base URL all have exactly one home.
 *
 * The base path is relative on purpose: Vite proxies `/api` in development, and
 * any reverse proxy can do the same in production, so no host is ever hardcoded.
 */

const BASE_PATH = '/api';

/** Build a query string, dropping unset values so the server defaults apply. */
function toQueryString(query: ListTicketsQuery): string {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.q) params.set('q', query.q);
  if (query.sort) params.set('sort', query.sort);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));

  const serialised = params.toString();
  return serialised ? `?${serialised}` : '';
}

/**
 * One request helper so every call gets the same error handling and JSON
 * handling. A network failure becomes a typed NETWORK error, not a bare
 * TypeError escaping into React.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_PATH}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiClientError('NETWORK', 'Could not reach the server. Check that the API is running.');
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  // 204 has no body; callers that expect data never ask for it.
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const ticketsApi = {
  list(query: ListTicketsQuery = {}): Promise<Ticket[]> {
    return request<Ticket[]>(`/tickets${toQueryString(query)}`);
  },

  get(id: number): Promise<Ticket> {
    return request<Ticket>(`/tickets/${id}`);
  },

  create(input: CreateTicketInput): Promise<Ticket> {
    return request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(input) });
  },

  update(id: number, input: UpdateTicketInput): Promise<Ticket> {
    return request<Ticket>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  },

  delete(id: number): Promise<void> {
    return request<void>(`/tickets/${id}`, { method: 'DELETE' });
  },
};
