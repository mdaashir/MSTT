import { useEffect, useState } from 'react';

/**
 * Debounced text input.
 *
 * Search must not fire a request per keystroke, and the list refetches whenever
 * its query changes. This delays propagation by `delayMs` and flushes early if
 * the field is cleared, so "clear search" feels instant.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // Clearing should be immediate; typing should wait.
    if (value === '' || value === null) {
      setDebounced(value);
      return;
    }

    const timer = setTimeout(() => setDebounced(value), delayMs);
    // A new keystroke cancels the pending timer, which is the debounce itself.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
