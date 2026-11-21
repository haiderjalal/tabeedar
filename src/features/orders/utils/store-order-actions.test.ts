import { describe, expect, it } from 'vitest';

import { ORDER_STATUSES, type OrderStatus } from './order-status';
import { storeActionsFor } from './store-order-actions';

/** The store's moves exactly as `order_transition_allowed('store', ...)` in migration 7 lists them. */
const DATABASE_RULES: Record<OrderStatus, OrderStatus[]> = {
  placed: ['accepted', 'rejected'],
  accepted: ['preparing', 'ready', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['cancelled'],
  picked_up: [],
  delivered: [],
  rejected: [],
  cancelled: [],
};

describe('storeActionsFor', () => {
  it.each(ORDER_STATUSES)('offers exactly the moves the database allows from %s', (status) => {
    const offered = storeActionsFor(status)
      .map((action) => action.to)
      .sort();
    expect(offered).toEqual([...DATABASE_RULES[status]].sort());
  });

  it('asks for a reason only when the order ends for the customer', () => {
    for (const status of ORDER_STATUSES) {
      for (const action of storeActionsFor(status)) {
        expect(action.asksForNote).toBe(action.to === 'rejected' || action.to === 'cancelled');
        expect(action.tone === 'danger').toBe(action.asksForNote);
      }
    }
  });

  it('leads with the move the store most likely wants', () => {
    expect(storeActionsFor('placed')[0]?.to).toBe('accepted');
    expect(storeActionsFor('accepted')[0]?.to).toBe('preparing');
    expect(storeActionsFor('preparing')[0]?.to).toBe('ready');
  });

  it('offers nothing once the order is with the rider or finished', () => {
    expect(storeActionsFor('picked_up')).toEqual([]);
    expect(storeActionsFor('delivered')).toEqual([]);
  });
});
