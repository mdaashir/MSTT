import { describe, expect, it } from 'vitest';
import { formatDate, badgeClass } from './format.js';

/**
 * Formatting helpers.
 *
 * These run in every row, so they must never throw on odd input: a bad timestamp
 * should degrade to something readable rather than blank the list.
 */
describe('formatDate', () => {
  it('formats a valid ISO timestamp', () => {
    const formatted = formatDate('2024-01-02T03:04:05.000Z');
    expect(formatted).not.toBe('');
    expect(formatted).not.toContain('Invalid');
  });

  it('returns the input unchanged when it cannot be parsed', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('badgeClass', () => {
  it('lowercases single-word values', () => {
    expect(badgeClass('High')).toBe('badge badge-high');
    expect(badgeClass('Resolved')).toBe('badge badge-resolved');
  });

  it('replaces spaces so multi-word statuses still produce one class', () => {
    expect(badgeClass('In Progress')).toBe('badge badge-in-progress');
  });
});
