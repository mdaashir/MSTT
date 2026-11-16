import { useState } from 'react';
import { ticketsApi } from '../api/tickets.js';
import { ApiClientError } from '../api/errors.js';
import { STATUSES } from '../types.js';
import type { Status, Ticket } from '../types.js';

/**
 * Status dropdown for one ticket.
 *
 * PATCHes the moment the selection changes, because that is the one action users
 * take most often and a save button for a single field is pure friction. While
 * the request is in flight the control is disabled, and a failure restores the
 * previous value so the dropdown never lies about what the server has.
 */
export function StatusSelect({
  ticket,
  onUpdated,
}: {
  ticket: Ticket;
  onUpdated(ticket: Ticket): void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = async (next: Status) => {
    if (next === ticket.status) return;

    setSaving(true);
    setError(null);
    try {
      const updated = await ticketsApi.update(ticket.id, { status: next });
      onUpdated(updated);
    } catch (caught) {
      // Leave `ticket` untouched: it still holds the server's current value, so
      // the controlled select snaps back on its own.
      setError(caught instanceof ApiClientError ? caught.message : 'Could not update the status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="field">
      <label className="field-label" htmlFor="status-select">
        Status
      </label>
      <select
        id="status-select"
        value={ticket.status}
        disabled={saving}
        onChange={(event) => void change(event.target.value as Status)}
      >
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      {saving ? <span className="muted saving-hint">Saving…</span> : null}
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
