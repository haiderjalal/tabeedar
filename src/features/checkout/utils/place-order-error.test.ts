import { describe, expect, it } from 'vitest';

import { toPlaceOrderErrorKey } from './place-order-error';

describe('toPlaceOrderErrorKey', () => {
  it.each([
    ['store_unavailable', 'storeUnavailable'],
    ['product_unavailable', 'productUnavailable'],
    ['invalid_items', 'invalidItems'],
    ['invalid_location', 'invalidLocation'],
  ])('maps the database code %s to %s', (message, expected) => {
    expect(toPlaceOrderErrorKey({ code: 'P0001', message })).toBe(expected);
  });

  it('reports a failed connection', () => {
    expect(toPlaceOrderErrorKey({ code: '', message: 'TypeError: Failed to fetch' })).toBe(
      'network',
    );
  });

  it('never shows an unknown or technical error to a person', () => {
    expect(
      toPlaceOrderErrorKey({ code: '42501', message: 'permission denied for table orders' }),
    ).toBe('generic');
    expect(toPlaceOrderErrorKey({ code: 'P0001', message: 'not_a_customer' })).toBe('generic');
    expect(toPlaceOrderErrorKey(null)).toBe('generic');
    expect(toPlaceOrderErrorKey(undefined)).toBe('generic');
  });
});
