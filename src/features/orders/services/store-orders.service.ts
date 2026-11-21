import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

import { STORE_ORDER_LIST_COLUMNS, parseStoreOrderList } from '../schemas/order.schema';
import type { StoreOrderListItem } from '../types';
import { ACTIVE_ORDER_STATUSES, FINISHED_ORDER_STATUSES } from '../utils/order-status';

/**
 * Reading a store's own orders. Row-level security only returns orders of the store the signed-in
 * owner runs, whatever is asked for here; filtering by `store_id` as well lets the database use the
 * store's index instead of scanning. Changing an order goes through `changeOrderStatus`.
 */

/** "active" orders still need something done; "history" ones are over. */
export type StoreOrderTab = 'active' | 'history';

interface ListStoreOrdersInput {
  storeId: number;
  tab: StoreOrderTab;
  offset: number;
  limit: number;
}

/** The store's orders for one tab, newest first, so a fresh order is always on top. */
export async function listStoreOrders({
  storeId,
  tab,
  offset,
  limit,
}: ListStoreOrdersInput): Promise<StoreOrderListItem[]> {
  const statuses = tab === 'active' ? ACTIVE_ORDER_STATUSES : FINISHED_ORDER_STATUSES;
  const { data, error } = await supabase
    .from('orders')
    .select(STORE_ORDER_LIST_COLUMNS)
    .eq('store_id', storeId)
    .in('status', [...statuses])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.warn('Could not load store orders', { code: error.code });
    throw error;
  }
  return parseStoreOrderList(data);
}

/** How many orders are waiting for the store to accept or reject them. */
export async function countNewOrders(storeId: number): Promise<number> {
  // `head: true` asks only for the count, so no rows travel over the network.
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'placed');

  if (error) {
    logger.warn('Could not count new orders', { code: error.code });
    throw error;
  }
  return count ?? 0;
}
