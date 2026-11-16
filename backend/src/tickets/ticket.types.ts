/**
 * Domain vocabulary for a ticket.
 *
 * These constants are the only place the allowed string values are written down
 * on the backend. The zod schemas, the SQLite `CHECK` constraints and the
 * TypeScript types are all derived from them, so a new priority or status is a
 * one-line change here plus the matching UI list.
 */

export const PRIORITIES = ['Low', 'Medium', 'High'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ['Open', 'In Progress', 'Resolved'] as const;
export type Status = (typeof STATUSES)[number];

/** Status assigned to a ticket that was just created. */
export const DEFAULT_STATUS: Status = 'Open';

export const SORT_ORDERS = ['newest', 'oldest'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

/**
 * A ticket as the API exposes it. Timestamps stay ISO-8601 UTC strings rather
 * than Date objects: they cross the JSON boundary as strings either way, and
 * keeping one representation avoids timezone surprises on the client.
 */
export type Ticket = {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
};

/** Fields accepted when creating a ticket. Status is not client-selectable. */
export type CreateTicketInput = Pick<Ticket, 'title' | 'description' | 'priority'>;

/** Partial update; every field is optional at the type level, the schema enforces at least one. */
export type UpdateTicketInput = Partial<Pick<Ticket, 'title' | 'description' | 'priority' | 'status'>>;

/** Query parameters for the list endpoint. */
export type ListTicketsQuery = {
  status?: Status;
  q?: string;
  sort: SortOrder;
  limit: number;
  offset: number;
};
