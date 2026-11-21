/** Every status an order can have. Mirrors the `order_status` type in the database. */
export const ORDER_STATUSES = [
  'placed',
  'accepted',
  'preparing',
  'ready',
  'picked_up',
  'delivered',
  'rejected',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Statuses of an order that can still change. */
export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  'placed',
  'accepted',
  'preparing',
  'ready',
  'picked_up',
];

/** Statuses after which nothing changes any more. Together with the active ones they cover every status. */
export const FINISHED_ORDER_STATUSES: readonly OrderStatus[] = [
  'delivered',
  'rejected',
  'cancelled',
];

/** An order that can still change. Screens keep refreshing these and stop for the others. */
export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_ORDER_STATUSES.includes(status);
}

/** Customers may cancel only before the store has responded (rule in `update_order_status`). */
export function canCustomerCancel(status: OrderStatus): boolean {
  return status === 'placed';
}

/** Statuses after which the order is final. */
export function isFinalStatus(status: OrderStatus): boolean {
  return !isActiveStatus(status);
}
