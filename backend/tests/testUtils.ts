import type { Express } from 'express';
import request from 'supertest';
import type { DatabaseHandle } from '../src/db/index.js';
import { createDatabase } from '../src/db/index.js';
import { createApp } from '../src/app.js';
import { createTicketRepository } from '../src/tickets/ticket.repository.js';
import { createTicketService } from '../src/tickets/ticket.service.js';

/**
 * Test harness.
 *
 * Each suite gets a fresh in-memory database and an app wired exactly the way
 * production is wired, only with different dependencies. That is the payoff of
 * createApp(deps): there is no test-only branch anywhere in the app code.
 */

export type TestApp = {
  app: Express;
  db: DatabaseHandle;
  close(): void;
};

export function createTestApp(): TestApp {
  const db = createDatabase(':memory:');
  const app = createApp({
    ticketService: createTicketService(createTicketRepository(db)),
    corsOrigin: 'http://localhost:5173',
  });

  return {
    app,
    db,
    close: () => db.close(),
  };
}

/** Valid ticket body used wherever the test is not about validation. */
export const validTicket = {
  title: 'Printer jam',
  description: 'The printer on floor 3 is jammed again.',
  priority: 'High' as const,
};

/** Seed rows with explicit timestamps so ordering assertions are deterministic. */
export function seedTickets(
  db: DatabaseHandle,
  rows: {
    title: string;
    description: string;
    priority: string;
    status: string;
    createdAt: string;
  }[],
): void {
  const insert = db.prepare(
    `INSERT INTO tickets (title, description, priority, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const row of rows) {
    insert.run(row.title, row.description, row.priority, row.status, row.createdAt, row.createdAt);
  }
}

/** Convenience wrapper so tests read as HTTP calls, not as fetch plumbing. */
export const api = (app: Express) => request(app);
