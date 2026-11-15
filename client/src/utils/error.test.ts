import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './error';

describe('getErrorMessage', () => {
  it('reads the message from Error instances', () => {
    expect(getErrorMessage(new Error('Network down'))).toBe('Network down');
  });

  it('returns string errors as-is', () => {
    expect(getErrorMessage('Invalid PIN')).toBe('Invalid PIN');
  });

  it('reads message from plain API error objects', () => {
    expect(getErrorMessage({ message: 'Forbidden' })).toBe('Forbidden');
  });

  it('uses the fallback for unknown shapes', () => {
    expect(getErrorMessage(null, 'Failed to save')).toBe('Failed to save');
    expect(getErrorMessage({ code: 500 }, 'Failed to save')).toBe('Failed to save');
  });
});
