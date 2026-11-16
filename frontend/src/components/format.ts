import type { Priority, Status } from '../types.js';

/**
 * Small presentation helpers shared by the list and details views.
 *
 * Both views must show the same ticket identically, so formatting lives here
 * rather than being re-implemented per component.
 */

/**
 * Render an ISO-8601 UTC timestamp as a local, readable date.
 * The API always sends UTC; `Intl` handles the conversion to the user's zone.
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** A stable, readable class suffix for priority and status badges. */
export function badgeClass(value: Priority | Status): string {
  return `badge badge-${value.toLowerCase().replace(/\s+/g, '-')}`;
}
