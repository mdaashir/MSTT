import type { DatabaseHandle } from '../db/index.js';
import type { CreateTicketInput, ListTicketsQuery, Ticket, UpdateTicketInput } from './ticket.types.js';
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
  list(query: ListTicketsQuery): Ticket[];
  findById(id: number): Ticket | undefined;
  update(id: number, input: UpdateTicketInput): Ticket | undefined;
};

/**
 * Factory rather than an exported singleton: tests inject an in-memory database
 * and get a completely isolated repository, and there is no shared mutable state
 * to leak between requests.
 */
export function createTicketRepository(db: DatabaseHandle): TicketRepository {
  /**
   * Local rather than a method reaching for `this`, so `update` can read the row
   * back without breaking if a caller ever destructures the repository.
   */
  function findById(id: number): Ticket | undefined {
    // `undefined` rather than a thrown error: "not found" is a rule the service
    // decides on, and the repository should not know about HTTP semantics.
    const row = db.prepare(`SELECT ${SELECT_COLUMNS} FROM tickets WHERE id = ?`).get(id) as
      | TicketRow
      | undefined;

    return row ? toTicket(row) : undefined;
  }

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

    list({ status, q, sort, limit, offset }: ListTicketsQuery): Ticket[] {
      // Clause list rather than string concatenation: every value is still bound
      // as a parameter, only the SQL *shape* is assembled from fixed fragments.
      const where: string[] = [];
      const params: unknown[] = [];

      if (status) {
        where.push('status = ?');
        params.push(status);
      }
      if (q) {
        // Case-insensitive substring match; `%` and `_` in user input are literal
        // here because LIKE wildcards are not escaped. Acceptable for a title
        // search, where the worst case is a broader match, not an injection.
        where.push('title LIKE ? COLLATE NOCASE');
        params.push(`%${q}%`);
      }

      // `sort` is a validated enum, so mapping it to SQL text cannot be injected.
      // `id` breaks ties for rows created within the same millisecond.
      const direction = sort === 'oldest' ? 'ASC' : 'DESC';
      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      const rows = db
        .prepare(
          `SELECT ${SELECT_COLUMNS} FROM tickets
           ${whereClause}
           ORDER BY created_at ${direction}, id ${direction}
           LIMIT ? OFFSET ?`,
        )
        .all(...params, limit, offset) as TicketRow[];

      return rows.map(toTicket);
    },

    findById,

    update(id: number, input: UpdateTicketInput): Ticket | undefined {
      // Build the SET list from the keys the caller actually sent. This is a
      // partial update by construction: absent fields keep their current value
      // instead of being overwritten with undefined.
      const columns: Record<keyof UpdateTicketInput, string> = {
        title: 'title',
        description: 'description',
        priority: 'priority',
        status: 'status',
      };

      const assignments: string[] = [];
      const params: unknown[] = [];

      for (const key of Object.keys(input) as (keyof UpdateTicketInput)[]) {
        assignments.push(`${columns[key]} = ?`);
        params.push(input[key]);
      }

      // Always refresh updated_at; that is what the column is for.
      assignments.push('updated_at = ?');
      params.push(new Date().toISOString());

      const result = db
        .prepare(`UPDATE tickets SET ${assignments.join(', ')} WHERE id = ?`)
        .run(...params, id);

      // No row matched: the caller asked to update something that does not exist.
      if (result.changes === 0) {
        return undefined;
      }

      return findById(id);
    },
  };
}
