import { useCallback, useEffect, useState } from 'react';
import { ticketsApi } from '../api/tickets.js';
import { ApiClientError } from '../api/errors.js';
import type { Ticket } from '../types.js';

/**
 * Data loading for a single ticket.
 *
 * Kept separate from the list hook because the details view needs the full
 * description and its own retry path; it should not re-fetch the whole list when
 * only one ticket's status changed.
 */
export type UseTicketResult = {
  ticket: Ticket | null;
  loading: boolean;
  error: ApiClientError | null;
  reload(): void;
  /** Replace the local copy after a successful update, avoiding a refetch. */
  setTicket(ticket: Ticket): void;
};

export function useTicket(id: number): UseTicketResult {
  const [ticket, setLocalTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiClientError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLocalTicket(await ticketsApi.get(id));
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught : new ApiClientError('INTERNAL', String(caught)));
      setLocalTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ticket, loading, error, reload: load, setTicket: setLocalTicket };
}
