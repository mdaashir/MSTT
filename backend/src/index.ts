import { config } from './config.js';
import { createApp } from './app.js';
import { createDatabase } from './db/index.js';
import { createTicketRepository } from './tickets/ticket.repository.js';
import { createTicketService } from './tickets/ticket.service.js';

/**
 * Composition root for the process: wire the real dependencies, then listen.
 *
 * The wiring lives here and nowhere else, so every other module receives what it
 * needs and never constructs it. That is the whole reason the app is testable
 * against an in-memory database.
 */

const db = createDatabase(config.databasePath);
const ticketRepository = createTicketRepository(db);
const ticketService = createTicketService(ticketRepository);

const app = createApp({ ticketService, corsOrigin: config.corsOrigin });

const server = app.listen(config.port, () => {
  console.log(`[api] listening on http://localhost:${config.port} (${config.nodeEnv})`);
  console.log(`[api] database: ${config.databasePath}`);
});

/**
 * Close the HTTP server and the database together. Without the explicit
 * `db.close()`, WAL checkpointing can be interrupted and leave stray files.
 */
function shutdown(signal: string): void {
  console.log(`[api] ${signal} received, shutting down`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
