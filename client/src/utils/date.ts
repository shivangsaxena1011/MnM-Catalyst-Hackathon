/**
 * Converts SQLite UTC timestamps ("YYYY-MM-DD HH:MM:SS") to ISO-8601 UTC ("YYYY-MM-DDTHH:MM:SSZ")
 * before passing to new Date(), ensuring correct local time representation in all timezones.
 */
export function parseServerDate(s: string): Date {
  if (!s) return new Date();
  const trimmed = s.trim();
  if (trimmed.includes(' ')) {
    const iso = trimmed.replace(' ', 'T');
    return new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  }
  if (trimmed.includes('T') && !trimmed.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}Z`);
  }
  return new Date(trimmed);
}
