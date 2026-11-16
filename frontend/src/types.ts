/**
 * Shared domain types for the UI.
 *
 * These mirror the API contract by hand rather than importing the backend's
 * types. The two packages deploy separately, so a shared package would just add
 * build plumbing for seven field names.
 */

export const PRIORITIES = ['Low', 'Medium', 'High'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ['Open', 'In Progress', 'Resolved'] as const;
export type Status = (typeof STATUSES)[number];

export const SORT_ORDERS = ['newest', 'oldest'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

/** Status the create form defaults to; the server also defaults to this. */
export const DEFAULT_STATUS: Status = 'Open';
/** Priority the create form defaults to. Not a server default. */
export const DEFAULT_FORM_PRIORITY: Priority = 'Medium';

export type Ticket = {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
};

export type CreateTicketInput = Pick<Ticket, 'title' | 'description' | 'priority'>;

export type UpdateTicketInput = Partial<Pick<Ticket, 'title' | 'description' | 'priority' | 'status'>>;

/** Query the list view sends. Every field is optional; the server defaults them. */
export type ListTicketsQuery = {
  status?: Status;
  q?: string;
  sort?: SortOrder;
  limit?: number;
  offset?: number;
};
