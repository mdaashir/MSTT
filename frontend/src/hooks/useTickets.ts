import { useCallback, useEffect, useRef, useState } from 'react';
import { ticketsApi } from '../api/tickets.js';
import { ApiClientError } from '../api/errors.js';
import type { ListTicketsQuery, Ticket } from '../types.js';

/**
 * Data loading for the ticket list.
 *
 * The list is server-filtered, server-searched, server-sorted and server-paged,
 * so this hook owns exactly one source of truth: the query. Changing it resets
 * pagination, and "load more" appends the next page rather than replacing, which
 * keeps the scroll position and the user's mental place.
 */

const PAGE_SIZE = 20;

export type UseTicketsResult = {
  tickets: Ticket[];
  loading: boolean;
  loadingMore: boolean;
  error: ApiClientError | null;
  hasMore: boolean;
  loadMore(): void;
  reload(): void;
};

export function useTickets(query: ListTicketsQuery): UseTicketsResult {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // The query that is actually loaded, so "load more" can extend it without
  // re-deriving from props that may have changed mid-flight.
  const loadedQuery = useRef<ListTicketsQuery>({});
  // Guards against a stale response overwriting a newer one when the user types.
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (nextQuery: ListTicketsQuery, mode: 'replace' | 'append') => {
      const id = ++requestId.current;
      if (mode === 'replace') {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const page = await ticketsApi.list({ ...nextQuery, limit: PAGE_SIZE });
        if (id !== requestId.current) return;

        loadedQuery.current = nextQuery;
        setTickets((current) => (mode === 'append' ? [...current, ...page] : page));
        // A short page means the server has nothing further, so hide the control
        // instead of issuing a request that returns an empty array.
        setHasMore(page.length === PAGE_SIZE);
      } catch (caught) {
        if (id !== requestId.current) return;
        setError(caught instanceof ApiClientError ? caught : new ApiClientError('INTERNAL', String(caught)));
        if (mode === 'replace') setTickets([]);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  // Any change to the query starts a fresh first page.
  useEffect(() => {
    void fetchPage({ ...query, offset: 0 }, 'replace');
  }, [query.status, query.q, query.sort, fetchPage]);

  const loadMore = useCallback(() => {
    void fetchPage({ ...loadedQuery.current, offset: tickets.length }, 'append');
  }, [fetchPage, tickets.length]);

  const reload = useCallback(() => {
    void fetchPage({ ...query, offset: 0 }, 'replace');
  }, [fetchPage, query]);

  return { tickets, loading, loadingMore, error, hasMore, loadMore, reload };
}
