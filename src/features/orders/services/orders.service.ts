import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

import {
  ORDER_COLUMNS,
  ORDER_EVENT_COLUMNS,
  ORDER_ITEM_COLUMNS,
  ORDER_LIST_COLUMNS,
  RIDER_CONTACT_COLUMNS,
  parseOrderDetails,
  parseOrderEvents,
  parseOrderItems,
  parseOrderList,
  parseRiderContact,
} from '../schemas/order.schema';
import type { OrderDetailBundle, OrderListItem, RiderContact } from '../types';
import { isActiveStatus, type OrderStatus } from '../utils/order-status';

/**
 * Reading and cancelling the signed-in customer's own orders. Row-level security means a customer
 * only ever receives their own orders, whatever is asked for here. Orders are never written
 * directly; the one change a customer can make goes through `update_order_status`.
 */

export interface ListOrdersInput {
  offset: number;
  limit: number;
}

/** The customer's orders, newest first. */
export async function listMyOrders({ offset, limit }: ListOrdersInput): Promise<OrderListItem[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_LIST_COLUMNS)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.warn('Could not load orders', { code: error.code });
    throw error;
  }
  return parseOrderList(data);
}

/** The rider's name and phone, or null if not available. A problem here must not hide the order. */
async function getRiderContact(riderId: string): Promise<RiderContact | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(RIDER_CONTACT_COLUMNS)
    .eq('id', riderId)
    .maybeSingle();

  if (error) {
    logger.warn('Could not load rider contact', { code: error.code });
    return null;
  }
  return data ? parseRiderContact(data) : null;
}

/**
 * One order with its items, history and (while it is in progress) the rider's contact details.
 * Returns null if the order does not exist or is not this customer's.
 */
export async function getOrderDetail(orderId: number): Promise<OrderDetailBundle | null> {
  const orderResult = await supabase
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('id', orderId)
    .maybeSingle();

  if (orderResult.error) {
    logger.warn('Could not load order', { code: orderResult.error.code });
    throw orderResult.error;
  }
  if (!orderResult.data) return null;
  const order = parseOrderDetails(orderResult.data);

  const [items, events, rider] = await Promise.all([
    supabase.from('order_items').select(ORDER_ITEM_COLUMNS).eq('order_id', orderId).order('id'),
    supabase
      .from('order_events')
      .select(ORDER_EVENT_COLUMNS)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true }),
    // The rider's details are only shared while the delivery is in progress.
    order.riderId !== null && isActiveStatus(order.status)
      ? getRiderContact(order.riderId)
      : Promise.resolve(null),
  ]);

  if (items.error || events.error) {
    const error = items.error ?? events.error;
    logger.warn('Could not load order details', { code: error?.code });
    throw error;
  }

  return {
    order,
    items: parseOrderItems(items.data),
    events: parseOrderEvents(events.data),
    rider,
  };
}

/**
 * Moves an order to a new status. The database decides whether the person asking may make that
 * move (see `order_transition_allowed`); the app only chooses which buttons to show.
 */
export async function changeOrderStatus(
  orderId: number,
  status: OrderStatus,
  note: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_status: status,
    p_note: note,
  });

  if (error) {
    logger.warn('Changing the order status failed', {
      code: error.code,
      reason: error.message,
      status,
    });
    throw error;
  }
}

/** Cancels an order. The database only allows it while the store has not responded yet. */
export async function cancelOrder(orderId: number): Promise<void> {
  await changeOrderStatus(orderId, 'cancelled', null);
}
