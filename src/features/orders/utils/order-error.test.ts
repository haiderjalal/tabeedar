import { describe, expect, it } from 'vitest';

import { toOrderErrorKey } from './order-error';

describe('toOrderErrorKey', () => {
  it('explains that the store already responded', () => {
    expect(toOrderErrorKey({ code: 'P0001', message: 'invalid_transition' })).toBe(
      'invalidTransition',
    );
  });

  it('handles an order that is gone or not theirs', () => {
    expect(toOrderErrorKey({ code: 'P0001', message: 'order_not_found' })).toBe('orderNotFound');
  });

  it('reports a failed connection', () => {
    expect(toOrderErrorKey({ code: '', message: 'Network request failed' })).toBe('network');
  });

  it('falls back to the generic message for anything else', () => {
    expect(toOrderErrorKey({ code: '42501', message: 'permission denied' })).toBe('generic');
    expect(toOrderErrorKey(undefined)).toBe('generic');
  });
});
