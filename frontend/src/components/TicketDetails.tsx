import { useTicket } from '../hooks/useTicket.js';
import { badgeClass, formatDate } from './format.js';
import { StatusSelect } from './StatusSelect.js';
import { ErrorState, LoadingState } from './states.js';

/**
 * Details view.
 *
 * Fetches the single ticket rather than reusing the row from the list: the row
 * is deliberately sparse (no full description), and this stays correct if the
 * ticket changed since the list was loaded.
 */
export function TicketDetails({
  id,
  onUpdated,
}: {
  id: number;
  /** Notifies the shell so the list can refresh after a status change. */
  onUpdated(ticket: { id: number }): void;
}) {
  const { ticket, loading, error, reload, setTicket } = useTicket(id);

  return (
    <section className="panel" aria-labelledby="details-heading">
      <div className="panel-header">
        <h2 id="details-heading">Ticket details</h2>
      </div>

      {loading ? <LoadingState label="Loading ticket…" /> : null}

      {!loading && error ? (
        <ErrorState message={error.message} onRetry={reload} showRetry={error.isRetryable} />
      ) : null}

      {!loading && !error && ticket ? (
        <div className="details">
          <h3 className="details-title">{ticket.title}</h3>

          <p className="details-description">{ticket.description}</p>

          <dl className="details-meta">
            <div>
              <dt>Priority</dt>
              <dd>
                <span className={badgeClass(ticket.priority)}>{ticket.priority}</span>
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className={badgeClass(ticket.status)}>{ticket.status}</span>
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(ticket.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatDate(ticket.updatedAt)}</dd>
            </div>
            <div>
              <dt>Ticket</dt>
              <dd>#{ticket.id}</dd>
            </div>
          </dl>

          <StatusSelect
            ticket={ticket}
            onUpdated={(updated) => {
              setTicket(updated);
              onUpdated(updated);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
