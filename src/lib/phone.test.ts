import { describe, expect, it } from 'vitest';

import { isValidPhone, normalizePhone } from './phone';

// The same pattern as the `phone_number` domain in supabase/migrations (the `+` is optional there).
const DATABASE_PHONE_PATTERN = /^\+?[0-9]{7,15}$/;

describe('normalizePhone', () => {
  it.each([
    ['0300 1234567', '+923001234567'],
    ['0300-1234567', '+923001234567'],
    ['03001234567', '+923001234567'],
    ['+92 300 1234567', '+923001234567'],
    ['923001234567', '+923001234567'],
    ['00923001234567', '+923001234567'],
    ['  (0300) 123-4567  ', '+923001234567'],
    ['051 1234567', '+92511234567'],
  ])('reads Pakistani number %s as %s', (typed, expected) => {
    expect(normalizePhone(typed)).toBe(expected);
  });

  it('keeps international numbers typed with + or 00', () => {
    expect(normalizePhone('+1 415 555 2671')).toBe('+14155552671');
    expect(normalizePhone('0044 20 7946 0958')).toBe('+442079460958');
  });

  it('leaves unreadable input unchanged apart from separators', () => {
    expect(normalizePhone('abc')).toBe('abc');
    expect(normalizePhone('12 34')).toBe('1234');
    expect(normalizePhone('')).toBe('');
  });
});

describe('isValidPhone', () => {
  it('accepts normalized numbers', () => {
    expect(isValidPhone('+923001234567')).toBe(true);
    expect(isValidPhone('+14155552671')).toBe(true);
  });

  it('rejects things the database would reject', () => {
    expect(isValidPhone('abc')).toBe(false);
    expect(isValidPhone('1234')).toBe(false);
    expect(isValidPhone('')).toBe(false);
    expect(isValidPhone('923001234567')).toBe(false); // missing +
    expect(isValidPhone('+1234567890123456')).toBe(false); // 16 digits
    expect(isValidPhone('+92 300 1234567')).toBe(false); // not normalized
  });

  it('never accepts a number the database would refuse', () => {
    const samples = ['0300 1234567', '+1 415 555 2671', '923001234567', '051 1234567', '12', 'x'];
    for (const sample of samples) {
      const normalized = normalizePhone(sample);
      if (isValidPhone(normalized)) {
        expect(normalized).toMatch(DATABASE_PHONE_PATTERN);
      }
    }
  });
});
