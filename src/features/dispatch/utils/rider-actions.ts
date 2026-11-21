import type { OrderStatus } from '@/features/orders/utils/order-status';

/** The statuses a rider moves an order to. Each is also a key in `rider:actions`. */
export type RiderActionTarget = Extract<OrderStatus, 'picked_up' | 'delivered'>;

/**
 * What the rider can do next with their delivery, or null when there is nothing to do yet (the
 * store is still preparing it) or any more (it is finished). Only decides which button to show;
 * the real rulebook is `order_transition_allowed` in the database (a unit test compares them).
 */
export function riderActionFor(status: OrderStatus): RiderActionTarget | null {
  switch (status) {
    case 'ready':
      return 'picked_up';
    case 'picked_up':
      return 'delivered';
    default:
      return null;
  }
}
