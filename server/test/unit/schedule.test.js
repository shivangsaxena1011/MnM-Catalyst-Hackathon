import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseScheduleSlots, resolveSlotTime, SLOT_DEFAULT_TIMES } from '../../src/utils/schedule.js';

describe('Schedule Utilities: parseScheduleSlots & resolveSlotTime', () => {
  describe('parseScheduleSlots', () => {
    it('should parse valid JSON array string', () => {
      assert.deepEqual(parseScheduleSlots('["morning","night"]'), ['morning', 'night']);
    });

    it('should handle already-array input', () => {
      assert.deepEqual(parseScheduleSlots(['morning', 'evening']), ['morning', 'evening']);
    });

    it('should fallback to [raw] when JSON parsing fails', () => {
      assert.deepEqual(parseScheduleSlots('morning'), ['morning']);
      assert.deepEqual(parseScheduleSlots('08:00'), ['08:00']);
    });

    it('should return default fallback array on null or undefined', () => {
      assert.deepEqual(parseScheduleSlots(null), ['morning']);
      assert.deepEqual(parseScheduleSlots(undefined), ['morning']);
    });
  });

  describe('resolveSlotTime', () => {
    it('should resolve standard slot names to their default times', () => {
      assert.equal(resolveSlotTime('morning'), '08:00');
      assert.equal(resolveSlotTime('afternoon'), '13:00');
      assert.equal(resolveSlotTime('evening'), '18:00');
      assert.equal(resolveSlotTime('night'), '21:00');
      assert.equal(resolveSlotTime('MORNING'), '08:00');
    });

    it('should use slot if it is a HH:MM string', () => {
      assert.equal(resolveSlotTime('14:30'), '14:30');
      assert.equal(resolveSlotTime('9:15'), '09:15');
    });

    it('should fallback to customTime when slot is not standard and not HH:MM', () => {
      assert.equal(resolveSlotTime('custom_slot', '11:45'), '11:45');
      assert.equal(resolveSlotTime('bedtime', '22:00'), '22:00');
    });

    it('should fallback to 09:00 when slot and customTime cannot be resolved', () => {
      assert.equal(resolveSlotTime('random_slot'), '09:00');
      assert.equal(resolveSlotTime('', null), '09:00');
    });
  });
});
