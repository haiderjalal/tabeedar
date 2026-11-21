import { describe, expect, it } from 'vitest';

import { formatDateTime, formatDistance, formatRupees } from './format';

describe('formatRupees', () => {
  it.each([
    [0, 'Rs 0'],
    [70, 'Rs 70'],
    [1250, 'Rs 1,250'],
    [345.5, 'Rs 345.5'],
    [2150.25, 'Rs 2,150.25'],
    [1234567, 'Rs 1,234,567'],
  ])('formats %s as %s', (amount, expected) => {
    expect(formatRupees(amount)).toBe(expected);
  });

  it('rounds away floating point noise', () => {
    expect(formatRupees(0.1 + 0.2)).toBe('Rs 0.3');
  });
});

describe('formatDistance', () => {
  it.each([
    [0, '0', 'm'],
    [850, '850', 'm'],
    [999.6, '1000', 'm'],
    [1000, '1.0', 'km'],
    [2012, '2.0', 'km'],
    [2350, '2.4', 'km'],
    [9999, '10.0', 'km'],
    [12500, '13', 'km'],
  ])('formats %s m as %s %s', (meters, value, unit) => {
    expect(formatDistance(meters)).toEqual({ value, unit });
  });
});

describe('formatDateTime', () => {
  it('formats in both languages without throwing', () => {
    const iso = '2026-11-20T09:05:00.000Z';
    for (const language of ['en', 'ur'] as const) {
      const text = formatDateTime(iso, language);
      expect(text).not.toBe('');
      expect(text).toContain('2026');
    }
  });

  it('returns an empty string for an unreadable date', () => {
    expect(formatDateTime('not a date', 'en')).toBe('');
  });
});
