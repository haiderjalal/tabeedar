import { describe, expect, it } from 'vitest';

import type { UserRole } from '@/features/auth/types';

import { ANDROID_CHANNEL_ID as SERVER_CHANNEL_ID } from '../../../../supabase/functions/_shared/expo-push';
import { NOTIFICATION_KINDS as SERVER_KINDS } from '../../../../supabase/functions/_shared/push-messages';
import { NOTIFICATION_KINDS, ANDROID_CHANNEL_ID } from '../constants';
import type { NotificationKind } from '../schemas/notification-payload';

import { routeForNotification } from './notification-route';

// The server's own list and channel id, so the app and the sender can never drift apart.

const at = (kind: NotificationKind) => ({ kind, orderId: 12 });

describe('routeForNotification', () => {
  it('opens the order for a customer, for every kind that is about their order', () => {
    for (const kind of [
      'order_accepted',
      'order_rejected',
      'order_ready',
      'order_picked_up',
      'order_delivered',
      'order_cancelled',
    ] as const) {
      expect(routeForNotification('customer', at(kind))).toEqual({
        pathname: '/my-orders/[id]',
        params: { id: '12' },
      });
    }
  });

  it('opens the order for a store when a new one arrives', () => {
    expect(routeForNotification('store', at('order_placed'))).toEqual({
      pathname: '/orders/[id]',
      params: { id: '12' },
    });
  });

  it('opens the offers for a rider alerted to a new delivery, and the delivery that was cancelled', () => {
    expect(routeForNotification('rider', at('delivery_available'))).toBe('/offers');
    expect(routeForNotification('rider', at('delivery_cancelled'))).toEqual({
      pathname: '/deliveries/[id]',
      params: { id: '12' },
    });
  });

  it('ignores a notification that does not belong to the signed-in role', () => {
    const wrong: [UserRole, NotificationKind][] = [
      ['customer', 'order_placed'],
      ['customer', 'delivery_available'],
      ['store', 'order_ready'],
      ['store', 'delivery_cancelled'],
      ['rider', 'order_delivered'],
      ['rider', 'order_placed'],
    ];
    for (const [role, kind] of wrong) {
      expect(routeForNotification(role, at(kind))).toBeNull();
    }
  });

  it('knows what to do with every kind for at least one role', () => {
    const roles: UserRole[] = ['customer', 'store', 'rider'];
    for (const kind of NOTIFICATION_KINDS) {
      expect(roles.some((role) => routeForNotification(role, at(kind)) !== null)).toBe(true);
    }
  });
});

describe('agreement with the sender', () => {
  it('uses the same kinds as the Edge Function', () => {
    expect([...NOTIFICATION_KINDS]).toEqual([...SERVER_KINDS]);
  });

  it('uses the same Android channel as the Edge Function', () => {
    expect(ANDROID_CHANNEL_ID).toBe(SERVER_CHANNEL_ID);
  });
});
