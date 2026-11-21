import { describe, expect, it } from 'vitest';

import {
  NOTIFICATION_KINDS,
  buildPushText,
  isNotificationKind,
  isPushLanguage,
  readParams,
} from './push-messages';

const params = { orderId: 42, storeName: 'Al-Fatah Fresh Mart' };

describe('buildPushText', () => {
  it.each(['en', 'ur'] as const)('has words for every kind in %s', (language) => {
    for (const kind of NOTIFICATION_KINDS) {
      const { title, body } = buildPushText(kind, language, params);
      expect(title.trim()).not.toBe('');
      expect(body.trim()).not.toBe('');
    }
  });

  it('names the order for the store and the store for the customer', () => {
    expect(buildPushText('order_placed', 'en', params).title).toBe('New order #42');
    expect(buildPushText('order_accepted', 'en', params).title).toBe(
      'Al-Fatah Fresh Mart accepted your order',
    );
  });

  it('writes Urdu, not English, for an Urdu phone', () => {
    const { title, body } = buildPushText('order_delivered', 'ur', params);
    expect(title).toBe('آرڈر پہنچ گیا');
    expect(body).toContain('Al-Fatah Fresh Mart');
    expect(`${title}${body}`).not.toMatch(/delivered|order/i);
  });

  it('tells a rider whose delivery was cancelled which order it was', () => {
    expect(buildPushText('delivery_cancelled', 'en', params).body).toContain('#42');
    expect(buildPushText('delivery_cancelled', 'ur', params).body).toContain('#42');
  });

  it('never mentions anything but the order number and the store', () => {
    // The only values a template can use are the two parameters; a template that interpolated
    // anything else would not compile. This guards the intent: no addresses or phone numbers.
    for (const kind of NOTIFICATION_KINDS) {
      const { title, body } = buildPushText(kind, 'en', { orderId: 7, storeName: 'S' });
      expect(`${title} ${body}`).not.toMatch(/\+92|street|house|phone/i);
    }
  });
});

describe('guards', () => {
  it('recognises the kinds and languages it knows', () => {
    expect(isNotificationKind('order_ready')).toBe(true);
    expect(isNotificationKind('order_shipped')).toBe(false);
    expect(isNotificationKind(undefined)).toBe(false);
    expect(isPushLanguage('ur')).toBe(true);
    expect(isPushLanguage('fr')).toBe(false);
  });
});

describe('readParams', () => {
  it('reads what the queue stores', () => {
    expect(readParams({ order_id: 5, store_name: 'Ali Traders' })).toEqual({
      orderId: 5,
      storeName: 'Ali Traders',
    });
  });

  it.each([
    null,
    'text',
    {},
    { order_id: '5', store_name: 'x' },
    { order_id: 0, store_name: 'x' },
    { order_id: 1.5, store_name: 'x' },
    { order_id: 5 },
    { order_id: 5, store_name: 3 },
  ])('refuses unexpected data: %j', (raw) => {
    expect(readParams(raw)).toBeNull();
  });
});
