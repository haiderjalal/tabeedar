import type { Href } from 'expo-router';

import type { UserRole } from '@/features/auth/types';

import type { NotificationPayload } from '../schemas/notification-payload';

/**
 * Where tapping a notification should take the person, or null if it does not belong to their role
 * (for example an old notification still on a phone another person signed in on). Each role only
 * gets screens of its own area; the area guards would refuse the rest anyway.
 */
export function routeForNotification(
  role: UserRole,
  { kind, orderId }: NotificationPayload,
): Href | null {
  switch (role) {
    case 'customer':
      return kind.startsWith('order_') && kind !== 'order_placed'
        ? { pathname: '/my-orders/[id]', params: { id: String(orderId) } }
        : null;
    case 'store':
      return kind === 'order_placed'
        ? { pathname: '/orders/[id]', params: { id: String(orderId) } }
        : null;
    case 'rider':
      if (kind === 'delivery_available') return '/offers';
      if (kind === 'delivery_cancelled') {
        return { pathname: '/deliveries/[id]', params: { id: String(orderId) } };
      }
      return null;
  }
}
