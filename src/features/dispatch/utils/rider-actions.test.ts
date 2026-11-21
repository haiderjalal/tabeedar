import { describe, expect, it } from 'vitest';

import { ORDER_STATUSES, type OrderStatus } from '@/features/orders/utils/order-status';

import { riderActionFor } from './rider-actions';

/** The rider's moves exactly as `order_transition_allowed('rider', ...)` in migration 7 lists them. */
const DATABASE_RULES: Partial<Record<OrderStatus, OrderStatus>> = {
  ready: 'picked_up',
  picked_up: 'delivered',
};

describe('riderActionFor', () => {
  it.each(ORDER_STATUSES)('offers exactly what the database allows from %s', (status) => {
    expect(riderActionFor(status)).toBe(DATABASE_RULES[status] ?? null);
  });

  it('has nothing to offer while the store is still preparing', () => {
    expect(riderActionFor('accepted')).toBeNull();
    expect(riderActionFor('preparing')).toBeNull();
  });
});
