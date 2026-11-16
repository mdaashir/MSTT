import type { Router } from 'express';
import express from 'express';
import { parseOrThrow } from '../middleware/validate.js';
import { requireJsonObject } from '../middleware/errorHandler.js';
import {
  createTicketSchema,
  listTicketsQuerySchema,
  ticketIdSchema,
  updateTicketSchema,
} from './ticket.schema.js';
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

  // Response is a plain array, not a wrapped envelope. Pagination is therefore
  // expressed through `limit`/`offset` and the client pages by appending; the
  // alternative would be a contract change to { data, total }.
  router.get('/', (req, res) => {
    const query = parseOrThrow(listTicketsQuerySchema, req.query);
    res.status(200).json(service.list(query));
  });

  router.get('/:id', (req, res) => {
    const id = parseOrThrow(ticketIdSchema, req.params.id);
    res.status(200).json(service.getById(id));
  });

  // PATCH rather than PUT: only the fields present in the body change, which is
  // what "update the status" from the UI needs and what the schema enforces.
  router.patch('/:id', requireJsonObject, (req, res) => {
    const id = parseOrThrow(ticketIdSchema, req.params.id);
    const input = parseOrThrow(updateTicketSchema, req.body);
    res.status(200).json(service.update(id, input));
  });

  router.delete('/:id', (req, res) => {
    const id = parseOrThrow(ticketIdSchema, req.params.id);
    service.delete(id);
    // 204 with no body: nothing meaningful to return once the row is gone.
    res.status(204).send();
  });

  return router;
}
