import { PRIORITIES, STATUSES, SORT_ORDERS } from './ticket.types.js';
import { z } from 'zod';

/**
 * Request schemas.
 *
 * One schema per request shape, and every one of them is `.strict()`: unknown
 * fields are rejected with 400 rather than silently dropped, so a client typo
 * surfaces immediately instead of looking like it worked.
 *
 * All string fields are trimmed before the non-empty check, which means a body
 * of `"   "` is a validation error, not a ticket with a blank title.
 */

const trimmedText = (label: string, max: number) =>
  z
    .string({ message: `${label} is required` })
    .trim()
    .min(1, { message: `${label} cannot be empty` })
    .max(max, { message: `${label} must be at most ${max} characters` });

export const createTicketSchema = z
  .object({
    title: trimmedText('Title', 200),
    description: trimmedText('Description', 5000),
    priority: z.enum(PRIORITIES, {
      message: `Priority must be one of: ${PRIORITIES.join(', ')}`,
    }),
  })
  .strict();

/**
 * PATCH accepts any subset of the editable fields, but at least one. Without the
 * `.refine`, `{}` would be a successful update that changed nothing.
 */
export const updateTicketSchema = z
  .object({
    title: trimmedText('Title', 200).optional(),
    description: trimmedText('Description', 5000).optional(),
    priority: z
      .enum(PRIORITIES, { message: `Priority must be one of: ${PRIORITIES.join(', ')}` })
      .optional(),
    status: z.enum(STATUSES, { message: `Status must be one of: ${STATUSES.join(', ')}` }).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

/**
 * List query parameters. Values arrive as strings, so numeric bounds are coerced;
 * `NaN` from a non-numeric string fails the integer check.
 */
export const listTicketsQuerySchema = z
  .object({
    status: z.enum(STATUSES, { message: `Status must be one of: ${STATUSES.join(', ')}` }).optional(),
    q: z.string().trim().max(200).optional(),
    sort: z.enum(SORT_ORDERS).default('newest'),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

/**
 * `:id` must be a positive integer. Express gives us a string, so this is the one
 * place that conversion is allowed to happen.
 */
export const ticketIdSchema = z.coerce
  .number({ message: 'Ticket id must be a number' })
  .int({ message: 'Ticket id must be an integer' })
  .positive({ message: 'Ticket id must be a positive integer' });

export type CreateTicketBody = z.infer<typeof createTicketSchema>;
export type UpdateTicketBody = z.infer<typeof updateTicketSchema>;
export type ListTicketsQueryInput = z.infer<typeof listTicketsQuerySchema>;
