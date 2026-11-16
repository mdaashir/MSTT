import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { PRIORITIES, STATUSES } from '../tickets/ticket.types.js';

/**
 * Database connection and schema initialisation.
 *
 * `better-sqlite3` is synchronous by design: each query returns its rows
 * directly. That removes a whole class of concurrency bugs for an app this
 * size, at the cost of throughput we do not need. Writes use WAL so a reader
 * never blocks behind an in-flight write, which matters when the UI polls the
 * list while a status update is in flight.
 */

export type DatabaseHandle = Database.Database;

/** SQL list literal built from the domain constants, e.g. 'Low','Medium','High'. */
const sqlList = (values: readonly string[]) => values.map((v) => `'${v}'`).join(', ');

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS tickets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    priority    TEXT NOT NULL CHECK (priority IN (${sqlList(PRIORITIES)})),
    status      TEXT NOT NULL DEFAULT 'Open' CHECK (status IN (${sqlList(STATUSES)})),
    -- ISO-8601 UTC strings, so ordering is plain lexicographic string comparison.
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tickets_status  ON tickets (status);
  CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets (created_at);
`;

/**
 * Opens a connection and makes sure the schema exists.
 *
 * Idempotent by design: a fresh clone needs no manual database step, and an
 * existing file is left untouched. Schema changes for this assessment are
 * applied by deleting the file (documented in the README).
 */
export function createDatabase(databasePath: string): DatabaseHandle {
  if (databasePath !== ':memory:') {
    // SQLite will not create missing parent directories for you.
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const db = new Database(databasePath);
  // WAL is a no-op for in-memory databases, so skip it there.
  if (databasePath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  // Fail fast on a locked database instead of blocking a request indefinitely.
  db.pragma('busy_timeout = 5000');
  db.exec(SCHEMA);
  return db;
}
