import type { Router } from 'express';
import express from 'express';
import { parseOrThrow } from '../middleware/validate.js';
import { requireJsonObject } from '../middleware/errorHandler.js';
import { createTicketSchema } from './ticket.schema.js';
import type { TicketService } from './ticket.service.js';

/**
 * HTTP layer for tickets.
 *
 * These handlers only translate between HTTP and the service: parse the input,
 * call one service method, choose a status code. No SQL, no rules.
 */
export function createTicketRouter(service: TicketService): Router {
  const router = express.Router();

  router.post('/', requireJsonObject, (req, res) => {
    const input = parseOrThrow(createTicketSchema, req.body);
    const ticket = service.create(input);
    res.status(201).json(ticket);
  });

  return router;
}
