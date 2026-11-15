import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseServerDate } from '../../../client/src/utils/date.ts';

describe('Client Date Helper: parseServerDate', () => {
  it('converts SQLite CURRENT_TIMESTAMP "YYYY-MM-DD HH:MM:SS" into UTC Date', () => {
    const rawSqlite = '2026-11-15 08:30:00';
    const parsed = parseServerDate(rawSqlite);

    assert.equal(parsed.toISOString(), '2026-11-15T08:30:00.000Z');
  });

  it('correctly handles ISO-8601 strings ending in Z', () => {
    const isoString = '2026-11-15T12:00:00.000Z';
    const parsed = parseServerDate(isoString);

    assert.equal(parsed.toISOString(), isoString);
  });

  it('handles empty or null inputs gracefully with fallback', () => {
    const fallback = parseServerDate('');
    assert.ok(fallback instanceof Date);
    assert.ok(!isNaN(fallback.getTime()));
  });

  it('appends UTC Z specifier to ISO strings lacking timezone offset', () => {
    const noZ = '2026-11-15T14:45:00';
    const parsed = parseServerDate(noZ);

    assert.equal(parsed.toISOString(), '2026-11-15T14:45:00.000Z');
  });
});
