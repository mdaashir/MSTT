import { useTickets } from '../hooks/useTickets.js';
import type { SortOrder, Status } from '../types.js';
import type { StatusFilter } from './FilterBar.js';
import { FilterBar } from './FilterBar.js';
import { TicketRow } from './TicketRow.js';
import { EmptyState, ErrorState, LoadingState } from './states.js';

/**
 * The list view.
 *
 * Owns the filter and sort selection (the page passes them in so they survive a
 * navigation to the details view) and renders the four states a list can be in:
 * loading, error, empty, and populated.
 */
export function TicketList({
  status,
  sort,
  search = '',
  refreshToken = 0,
  onStatusChange,
  onSortChange,
  onSelect,
}: {
  status: StatusFilter;
  sort: SortOrder;
  /** Already debounced by the shell; empty means no title filter. */
  search?: string;
  refreshToken?: number;
  onStatusChange(next: StatusFilter): void;
  onSortChange(next: SortOrder): void;
  onSelect(id: number): void;
}) {
  // "all" maps to undefined so the server applies its own default rather than
  // us sending a sentinel value it would reject.
  const { tickets, loading, loadingMore, error, hasMore, loadMore, reload } = useTickets(
    {
      status: status === 'all' ? undefined : (status as Status),
      sort,
      q: search.trim() === '' ? undefined : search.trim(),
    },
    refreshToken,
  );

  return (
    <section className="panel" aria-labelledby="list-heading">
      <div className="panel-header">
        <h2 id="list-heading">Tickets</h2>
        <div className="sort-toggle" role="group" aria-label="Sort tickets">
          <button
            type="button"
            className={sort === 'newest' ? 'chip chip-active' : 'chip'}
            aria-pressed={sort === 'newest'}
            onClick={() => onSortChange('newest')}
          >
            Newest
          </button>
          <button
            type="button"
            className={sort === 'oldest' ? 'chip chip-active' : 'chip'}
            aria-pressed={sort === 'oldest'}
            onClick={() => onSortChange('oldest')}
          >
            Oldest
          </button>
        </div>
      </div>

      <FilterBar value={status} onChange={onStatusChange} />

      {loading ? <LoadingState label="Loading tickets…" /> : null}

      {!loading && error ? (
        <ErrorState message={error.message} onRetry={reload} showRetry={error.isRetryable} />
      ) : null}

      {!loading && !error && tickets.length === 0 ? (
        <EmptyState>
          {status === 'all'
            ? 'No tickets yet. Create the first one on the left.'
            : `No tickets with status "${status}".`}
        </EmptyState>
      ) : null}

      {!loading && !error && tickets.length > 0 ? (
        <>
          <ul className="ticket-list">
            {tickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} onSelect={onSelect} />
            ))}
          </ul>
          {hasMore ? (
            <button
              type="button"
              className="button button-secondary load-more"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
