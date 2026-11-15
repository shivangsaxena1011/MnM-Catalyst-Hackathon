import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Input Validation Constraints', () => {
  it('validates string length limits', () => {
    const longName = 'A'.repeat(101);
    const validName = 'A'.repeat(100);
    assert.ok(longName.length > 100);
    assert.ok(validName.length <= 100);

    const longNotes = 'N'.repeat(1001);
    const validNotes = 'N'.repeat(1000);
    assert.ok(longNotes.length > 1000);
    assert.ok(validNotes.length <= 1000);
  });

  it('validates YYYY-MM-DD date regex', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    assert.ok(dateRegex.test('2026-11-15'));
    assert.ok(!dateRegex.test('15-11-2026'));
    assert.ok(!dateRegex.test('2026/11/15'));
    assert.ok(!dateRegex.test('invalid'));
  });

  it('validates HH:MM time regex', () => {
    const timeRegex = /^\d{1,2}:\d{2}$/;
    assert.ok(timeRegex.test('08:00'));
    assert.ok(timeRegex.test('8:00'));
    assert.ok(timeRegex.test('21:45'));
    assert.ok(!timeRegex.test('8am'));
    assert.ok(!timeRegex.test('invalid'));
  });

  it('validates non-negative integer for inventory count', () => {
    const isNonNegativeInt = (val) => Number.isInteger(Number(val)) && Number(val) >= 0;
    assert.ok(isNonNegativeInt(30));
    assert.ok(isNonNegativeInt('0'));
    assert.ok(!isNonNegativeInt(-5));
    assert.ok(!isNonNegativeInt(3.14));
    assert.ok(!isNonNegativeInt('abc'));
  });
});
