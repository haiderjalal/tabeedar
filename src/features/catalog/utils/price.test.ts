import { describe, expect, it } from 'vitest';

import { formatPriceInput, parsePrice } from './price';

describe('parsePrice', () => {
  it('reads whole and decimal prices', () => {
    expect(parsePrice('250')).toBe(250);
    expect(parsePrice('99.5')).toBe(99.5);
    expect(parsePrice('1250.50')).toBe(1250.5);
  });

  it('ignores spaces and thousands commas', () => {
    expect(parsePrice(' 1,250 ')).toBe(1250);
    expect(parsePrice('1 250.75')).toBe(1250.75);
  });

  it('reads Urdu and Arabic digits and separators', () => {
    expect(parsePrice('۱۲۵۰')).toBe(1250);
    expect(parsePrice('٣٥٫٥')).toBe(35.5);
    expect(parsePrice('۱٬۲۵۰')).toBe(1250);
  });

  it('accepts zero, as the database does', () => {
    expect(parsePrice('0')).toBe(0);
  });

  it('rejects text that is not a price', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
    expect(parsePrice('12abc')).toBeNull();
    expect(parsePrice('-5')).toBeNull();
    expect(parsePrice('1.234')).toBeNull();
    expect(parsePrice('1.')).toBeNull();
    expect(parsePrice('.5')).toBeNull();
  });

  it('rejects prices above the guard', () => {
    expect(parsePrice('10000000')).toBe(10_000_000);
    expect(parsePrice('10000001')).toBeNull();
  });
});

describe('formatPriceInput', () => {
  it('drops the decimals of whole prices and keeps two places otherwise', () => {
    expect(formatPriceInput(250)).toBe('250');
    expect(formatPriceInput(99.5)).toBe('99.50');
    expect(formatPriceInput(1250.75)).toBe('1250.75');
  });
});
