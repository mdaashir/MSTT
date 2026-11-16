import { STATUSES } from '../types.js';
import type { Status } from '../types.js';

/**
 * Status filter.
 *
 * Filtering happens on the server through the `status` query param, so this
 * component only reports the selection upward. "All" is represented as
 * `undefined` rather than a magic string, which matches the API contract.
 */
export type StatusFilter = Status | 'all';

export function FilterBar({
  value,
  onChange,
  counts,
}: {
  value: StatusFilter;
  onChange(next: StatusFilter): void;
  /** Optional per-status counts for the current unfiltered result, when known. */
  counts?: Partial<Record<StatusFilter, number>>;
}) {
  const options: StatusFilter[] = ['all', ...STATUSES];

  return (
    <div className="filter-bar" role="group" aria-label="Filter tickets by status">
      {options.map((option) => {
        const label = option === 'all' ? 'All' : option;
        const count = counts?.[option];
        return (
          <button
            key={option}
            type="button"
            className={option === value ? 'chip chip-active' : 'chip'}
            aria-pressed={option === value}
            onClick={() => onChange(option)}
          >
            {label}
            {count !== undefined ? <span className="chip-count">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
