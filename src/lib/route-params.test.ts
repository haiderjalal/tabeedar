import { describe, expect, it } from 'vitest';

import { parseIdParam } from './route-params';

describe('parseIdParam', () => {
  it('reads a plain positive whole number', () => {
    expect(parseIdParam('1')).toBe(1);
    expect(parseIdParam('42')).toBe(42);
    expect(parseIdParam('123456789012345')).toBe(123456789012345);
  });

  it('uses the first value when the address repeats the parameter', () => {
    expect(parseIdParam(['7', '8'])).toBe(7);
  });

  it.each([
    ['nothing', undefined],
    ['an empty list', []],
    ['empty text', ''],
    ['zero', '0'],
    ['a negative number', '-3'],
    ['a decimal', '1.5'],
    ['a leading zero', '007'],
    ['letters', 'abc'],
    ['a mix', '12abc'],
    ['a number with spaces', ' 12'],
    ['an exponent', '1e3'],
    ['hex', '0x10'],
    ['a number too large to be safe', '1234567890123456789'],
    ['an injection attempt', '1; drop table orders'],
  ])('rejects %s', (_name, value) => {
    expect(parseIdParam(value)).toBeNull();
  });
});
