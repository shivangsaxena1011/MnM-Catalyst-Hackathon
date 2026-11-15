/**
 * Standard slot mapping for default dosage times
 */
export const SLOT_DEFAULT_TIMES = {
  morning: '08:00',
  afternoon: '13:00',
  evening: '18:00',
  night: '21:00',
};

/**
 * Parses schedule_slots stored as JSON string with fallback to [raw].
 * Guarantees returning an array of slot strings.
 * @param {any} raw 
 * @returns {string[]}
 */
export function parseScheduleSlots(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw === null || raw === undefined) return ['morning'];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [String(parsed)];
  } catch {
    return [String(raw)];
  }
}

/**
 * Resolves effective HH:MM time string for a medication slot.
 * Priority: SLOT_DEFAULT_TIMES[slot.toLowerCase()] → "HH:MM" slot literal → customTime → '09:00'
 * @param {string} slot 
 * @param {string|null} [customTime] 
 * @returns {string} Formatted HH:MM string
 */
export function resolveSlotTime(slot, customTime = null) {
  const normalizedSlot = (slot || '').trim();
  const defaultSlotTime = SLOT_DEFAULT_TIMES[normalizedSlot.toLowerCase()];
  if (defaultSlotTime) {
    return defaultSlotTime;
  }
  if (/^\d{1,2}:\d{2}$/.test(normalizedSlot)) {
    return normalizedSlot.length === 4 ? `0${normalizedSlot}` : normalizedSlot;
  }
  if (customTime && /^\d{1,2}:\d{2}$/.test(customTime)) {
    return customTime.length === 4 ? `0${customTime}` : customTime;
  }
  return '09:00';
}
