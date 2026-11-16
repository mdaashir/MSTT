import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createTicketRouter } from './tickets/ticket.routes.js';
import type { TicketService } from './tickets/ticket.service.js';

/**
 * Composition root for the Express app.
 *
 * Dependencies arrive as arguments instead of being imported as singletons. That
 * is what lets a test construct the app against an in-memory SQLite database and
 * a production boot construct it against a file, with no conditionals anywhere
 * in the code under test.
 */

export type AppDependencies = {
  ticketService: TicketService;
  corsOrigin: string;
};

export function createApp({ ticketService, corsOrigin }: AppDependencies): Express {
  const app = express();

  // Only the dev Vite origin is allowed by default; there is no auth, so CORS is
  // the only thing standing between the API and an arbitrary browser page.
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '64kb' }));

  app.use('/api/tickets', createTicketRouter(ticketService));

  // Order matters: unknown routes first, then the single error funnel.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
