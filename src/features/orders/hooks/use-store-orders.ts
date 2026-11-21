import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { orderRefreshInterval } from '@/lib/realtime/realtime-status';

import { orderKeys } from '../query-keys';
import {
  countNewOrders,
  listStoreOrders,
  type StoreOrderTab,
} from '../services/store-orders.service';
import type { StoreOrderListItem } from '../types';

export const STORE_ORDERS_PAGE_SIZE = 20;

/**
 * How often a store's order list is checked for news when live updates are not connected. Stores
 * keep this screen open all day, so a new order has to appear without anyone pulling to refresh.
 * While live updates are connected, changes arrive at once and this slows to a safety net.
 */
export const STORE_ORDERS_REFRESH_MS = 15_000;

/** A store's orders in pages. The "active" tab refreshes by itself; "history" does not change. */
export function useStoreOrders(
  storeId: number,
  tab: StoreOrderTab,
): UseInfiniteQueryResult<InfiniteData<StoreOrderListItem[], number>, Error> {
  return useInfiniteQuery({
    queryKey: orderKeys.storeList(storeId, tab),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listStoreOrders({ storeId, tab, offset: pageParam, limit: STORE_ORDERS_PAGE_SIZE }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < STORE_ORDERS_PAGE_SIZE
        ? undefined
        : allPages.length * STORE_ORDERS_PAGE_SIZE,
    refetchInterval: tab === 'active' ? () => orderRefreshInterval(STORE_ORDERS_REFRESH_MS) : false,
  });
}

/** How many orders wait for an answer, for the badge on the Orders tab. `storeId` null disables it. */
export function useNewOrderCount(storeId: number | null): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: orderKeys.storeNewCount(storeId ?? 0),
    queryFn: () => (storeId === null ? Promise.resolve(0) : countNewOrders(storeId)),
    enabled: storeId !== null,
    refetchInterval: () => orderRefreshInterval(STORE_ORDERS_REFRESH_MS),
  });
}
