import { describe, expect, it } from 'vitest';

import {
  ACTIVE_ORDER_STATUSES,
  FINISHED_ORDER_STATUSES,
  ORDER_STATUSES,
  canCustomerCancel,
  isActiveStatus,
  isFinalStatus,
  isOrderStatus,
} from './order-status';

describe('order status helpers', () => {
  it('knows all eight statuses from the database', () => {
    expect([...ORDER_STATUSES].sort()).toEqual(
      [
        'accepted',
        'cancelled',
        'delivered',
        'picked_up',
        'placed',
        'preparing',
        'ready',
        'rejected',
      ].sort(),
    );
  });

  it('recognises valid statuses and rejects everything else', () => {
    expect(isOrderStatus('placed')).toBe(true);
    expect(isOrderStatus('picked_up')).toBe(true);
    expect(isOrderStatus('shipped')).toBe(false);
    expect(isOrderStatus('')).toBe(false);
    expect(isOrderStatus(null)).toBe(false);
    expect(isOrderStatus(3)).toBe(false);
  });

  it('splits statuses into active and final, with no overlap and no gap', () => {
    for (const status of ORDER_STATUSES) {
      expect(isActiveStatus(status)).toBe(!isFinalStatus(status));
    }
    expect(ORDER_STATUSES.filter(isActiveStatus)).toEqual([
      'placed',
      'accepted',
      'preparing',
      'ready',
      'picked_up',
    ]);
    expect(ORDER_STATUSES.filter(isFinalStatus)).toEqual(['delivered', 'rejected', 'cancelled']);
  });

  it('exports the two groups the store screens query by, covering every status once', () => {
    expect([...ACTIVE_ORDER_STATUSES, ...FINISHED_ORDER_STATUSES].sort()).toEqual(
      [...ORDER_STATUSES].sort(),
    );
  });

  it('lets a customer cancel only while the order is waiting for the store', () => {
    expect(ORDER_STATUSES.filter(canCustomerCancel)).toEqual(['placed']);
  });
});
