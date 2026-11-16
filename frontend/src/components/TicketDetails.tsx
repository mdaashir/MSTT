import { useState } from 'react';
import { ticketsApi } from '../api/tickets.js';
import { ApiClientError } from '../api/errors.js';
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
  onDeleted,
}: {
  id: number;
  /** Notifies the shell so the list can refresh after a status change. */
  onUpdated(ticket: { id: number }): void;
  /** Clears the selection and refreshes the list. */
  onDeleted(id: number): void;
}) {
  const { ticket, loading, error, reload, setTicket } = useTicket(id);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * Delete asks for confirmation first because it is irreversible: the API does
   * a hard delete and there is no undo.
   */
  const remove = async () => {
    if (!ticket) return;
    if (!window.confirm(`Delete ticket #${ticket.id} "${ticket.title}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await ticketsApi.delete(ticket.id);
      onDeleted(ticket.id);
    } catch (caught) {
      setDeleteError(caught instanceof ApiClientError ? caught.message : 'Could not delete the ticket');
    } finally {
      setDeleting(false);
    }
  };

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

          <div className="details-actions">
            <button
              type="button"
              className="button button-danger"
              onClick={() => void remove()}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete ticket'}
            </button>
            {deleteError ? (
              <span className="field-error" role="alert">
                {deleteError}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
