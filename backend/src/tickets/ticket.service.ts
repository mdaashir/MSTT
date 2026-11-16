import type { CreateTicketInput, ListTicketsQuery, Ticket } from './ticket.types.js';
import type { TicketRepository } from './ticket.repository.js';

/**
 * Business rules for tickets.
 *
 * The service exists between HTTP and SQL so that rules live in one place.
 * Creating a ticket is currently a pure passthrough because the rules already
 * ran in the schema layer; the split matters because the list, get and update
 * paths grow real logic (not-found handling, defaults) and none of it belongs
 * in a route handler or a repository.
 */

export type TicketService = {
  create(input: CreateTicketInput): Ticket;
  list(query: ListTicketsQuery): Ticket[];
};

export function createTicketService(repository: TicketRepository): TicketService {
  return {
    create(input) {
      return repository.create(input);
    },

    list(query) {
      // The schema already applied the defaults and bounds, so the query that
      // arrives here is complete. The service stays thin until there is a rule
      // that is not about HTTP shape, such as visibility or ownership.
      return repository.list(query);
    },
  };
}
