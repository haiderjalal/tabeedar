import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';

import { orderKeys } from '../query-keys';
import { listMyOrders } from '../services/orders.service';
import type { OrderListItem } from '../types';

export const ORDERS_PAGE_SIZE = 20;

/** The customer's orders in pages, newest first. */
export function useMyOrders(): UseInfiniteQueryResult<
  InfiniteData<OrderListItem[], number>,
  Error
> {
  return useInfiniteQuery({
    queryKey: orderKeys.list,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => listMyOrders({ offset: pageParam, limit: ORDERS_PAGE_SIZE }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < ORDERS_PAGE_SIZE ? undefined : allPages.length * ORDERS_PAGE_SIZE,
  });
}
