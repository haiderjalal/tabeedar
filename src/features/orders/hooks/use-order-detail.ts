import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { orderRefreshInterval } from '@/lib/realtime/realtime-status';

import { orderKeys } from '../query-keys';
import { getOrderDetail } from '../services/orders.service';
import type { OrderDetailBundle } from '../types';
import { isActiveStatus } from '../utils/order-status';

/**
 * How often an order that can still change is checked for news when live updates are not connected.
 * While they are, changes arrive at once and this slows to a safety net (see `realtime-status`).
 */
export const ACTIVE_ORDER_REFRESH_MS = 10_000;

/**
 * One order, refreshed every few seconds while it is in progress (so "the store accepted your
 * order" appears without pulling to refresh) and left alone once it is final. `data` is null when
 * the order does not exist or is not the customer's.
 */
export function useOrderDetail(orderId: number): UseQueryResult<OrderDetailBundle | null, Error> {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrderDetail(orderId),
    refetchInterval: (query) => {
      const status = query.state.data?.order.status;
      return status !== undefined && isActiveStatus(status)
        ? orderRefreshInterval(ACTIVE_ORDER_REFRESH_MS)
        : false;
    },
  });
}
