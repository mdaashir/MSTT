import type { Ticket } from '../types.js';
import { badgeClass, formatDate } from './format.js';

/**
 * One row of the ticket list.
 *
 * A real `<button>` rather than a clickable `<tr>`: it is keyboard reachable and
 * announced as interactive for free, and the row is the only thing to activate.
 */
export function TicketRow({ ticket, onSelect }: { ticket: Ticket; onSelect(id: number): void }) {
  return (
    <li className="ticket-row">
      <button type="button" className="ticket-row-button" onClick={() => onSelect(ticket.id)}>
        <span className="ticket-row-title">{ticket.title}</span>
        <span className={badgeClass(ticket.priority)}>{ticket.priority}</span>
        <span className={badgeClass(ticket.status)}>{ticket.status}</span>
        <span className="ticket-row-date">{formatDate(ticket.createdAt)}</span>
      </button>
    </li>
  );
}
