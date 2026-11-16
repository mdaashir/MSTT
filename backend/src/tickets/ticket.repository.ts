import type { DatabaseHandle } from '../db/index.js';
import type { CreateTicketInput, Ticket } from './ticket.types.js';
import { DEFAULT_STATUS } from './ticket.types.js';

/**
 * The only layer that knows SQL.
 *
 * Two rules keep it that way: nothing here touches `req`/`res`, and every column
 * mapping between snake_case storage and camelCase JSON happens in `toTicket`.
 * Handlers and services therefore never think about column names.
 */

/** Row shape exactly as SQLite returns it. */
type TicketRow = {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
};

/** Column list used by every SELECT, kept in sync with `toTicket`. */
const SELECT_COLUMNS = 'id, title, description, priority, status, created_at, updated_at';

function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority as Ticket['priority'],
    status: row.status as Ticket['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type TicketRepository = {
  create(input: CreateTicketInput): Ticket;
};

/**
 * Factory rather than an exported singleton: tests inject an in-memory database
 * and get a completely isolated repository, and there is no shared mutable state
 * to leak between requests.
 */
export function createTicketRepository(db: DatabaseHandle): TicketRepository {
  return {
    create(input: CreateTicketInput): Ticket {
      // One timestamp for both columns: a row created and read moments later
      // should not claim it was updated after it was created.
      const now = new Date().toISOString();

      const result = db
        .prepare(
          `INSERT INTO tickets (title, description, priority, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(input.title, input.description, input.priority, DEFAULT_STATUS, now, now);

      const row = db
        .prepare(`SELECT ${SELECT_COLUMNS} FROM tickets WHERE id = ?`)
        .get(result.lastInsertRowid) as TicketRow;

      return toTicket(row);
    },
  };
}
