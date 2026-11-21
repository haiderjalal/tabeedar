import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { isActiveStatus } from '@/features/orders/utils/order-status';
import { orderRefreshInterval } from '@/lib/realtime/realtime-status';

import { RIDER_REFRESH_MS } from '../constants';
import { dispatchKeys } from '../query-keys';
import { getDeliveryDetail, listDeliveries, type DeliveryTab } from '../services/dispatch.service';
import type { DeliveryDetailBundle, DeliveryListItem } from '../types';

export const DELIVERIES_PAGE_SIZE = 20;

/** The rider's deliveries in pages. The active tab refreshes by itself; history does not change. */
export function useDeliveries(
  tab: DeliveryTab,
): UseInfiniteQueryResult<InfiniteData<DeliveryListItem[], number>, Error> {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useInfiniteQuery({
    queryKey: dispatchKeys.deliveries(tab),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      userId === null
        ? Promise.resolve([])
        : listDeliveries({ userId, tab, offset: pageParam, limit: DELIVERIES_PAGE_SIZE }),
    enabled: userId !== null,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < DELIVERIES_PAGE_SIZE ? undefined : allPages.length * DELIVERIES_PAGE_SIZE,
    refetchInterval: tab === 'active' ? () => orderRefreshInterval(RIDER_REFRESH_MS) : false,
  });
}

/**
 * One delivery, refreshed every few seconds while it can still change (the store marking it ready,
 * or cancelling it) and left alone once it is final. `data` is null if it is not this rider's.
 */
export function useDeliveryDetail(
  orderId: number,
): UseQueryResult<DeliveryDetailBundle | null, Error> {
  return useQuery({
    queryKey: dispatchKeys.delivery(orderId),
    queryFn: () => getDeliveryDetail(orderId),
    refetchInterval: (query) => {
      const status = query.state.data?.order.status;
      return status !== undefined && isActiveStatus(status)
        ? orderRefreshInterval(RIDER_REFRESH_MS)
        : false;
    },
  });
}
