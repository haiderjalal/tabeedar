import { describe, expect, it } from 'vitest';

import { toDispatchErrorKey } from './dispatch-error';

describe('toDispatchErrorKey', () => {
  it.each([
    ['delivery_unavailable', 'deliveryUnavailable'],
    ['already_delivering', 'alreadyDelivering'],
    ['rider_not_available', 'notAvailable'],
    ['rider_not_approved', 'notApproved'],
    ['location_required', 'locationRequired'],
    ['invalid_location', 'locationRequired'],
    ['invalid_transition', 'invalidTransition'],
    ['order_not_found', 'orderNotFound'],
  ])('maps the database code %s', (message, key) => {
    expect(toDispatchErrorKey({ code: 'P0001', message })).toBe(key);
  });

  it('recognises a lost connection', () => {
    expect(toDispatchErrorKey({ code: '', message: 'Network request failed' })).toBe('network');
  });

  it('falls back to a generic message', () => {
    expect(toDispatchErrorKey({ code: 'P0001', message: 'something_new' })).toBe('generic');
    expect(toDispatchErrorKey(undefined)).toBe('generic');
  });
});
