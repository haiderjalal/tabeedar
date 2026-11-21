import { describe, expect, it } from 'vitest';

import { parseNotificationPayload } from './notification-payload';

describe('parseNotificationPayload', () => {
  it('reads what the sender puts in a notification', () => {
    expect(parseNotificationPayload({ kind: 'order_ready', orderId: 7 })).toEqual({
      kind: 'order_ready',
      orderId: 7,
    });
  });

  it('ignores extra fields', () => {
    expect(parseNotificationPayload({ kind: 'order_ready', orderId: 7, url: 'x' })).toEqual({
      kind: 'order_ready',
      orderId: 7,
    });
  });

  it.each([
    undefined,
    null,
    'order_ready',
    {},
    { kind: 'order_ready' },
    { orderId: 7 },
    { kind: 'order_shipped', orderId: 7 },
    { kind: 'order_ready', orderId: '7' },
    { kind: 'order_ready', orderId: 0 },
    { kind: 'order_ready', orderId: -3 },
    { kind: 'order_ready', orderId: 2.5 },
  ])('refuses data that is not ours: %j', (data) => {
    expect(parseNotificationPayload(data)).toBeNull();
  });
});
