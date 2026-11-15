import { describe, expect, it } from 'vitest';
import { parseServerDate } from './date';

describe('parseServerDate', () => {
  it('treats SQLite CURRENT_TIMESTAMP values as UTC', () => {
    const d = parseServerDate('2026-11-15 09:39:00');
    expect(d.toISOString()).toBe('2026-11-15T09:39:00.000Z');
  });

  it('treats ISO strings without an offset as UTC', () => {
    expect(parseServerDate('2026-11-15T09:39:00').toISOString()).toBe('2026-11-15T09:39:00.000Z');
  });

  it('keeps explicit UTC and offset timestamps unchanged', () => {
    expect(parseServerDate('2026-11-15T09:39:00Z').toISOString()).toBe('2026-11-15T09:39:00.000Z');
    expect(parseServerDate('2026-11-15T15:09:00+05:30').toISOString()).toBe('2026-11-15T09:39:00.000Z');
  });

  it('ignores surrounding whitespace', () => {
    expect(parseServerDate('  2026-11-15 09:39:00  ').toISOString()).toBe('2026-11-15T09:39:00.000Z');
  });

  it('falls back to a valid Date for empty input', () => {
    expect(Number.isNaN(parseServerDate('').getTime())).toBe(false);
  });
});
