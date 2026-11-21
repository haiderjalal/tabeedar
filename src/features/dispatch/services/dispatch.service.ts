import type { Coordinates } from '@/features/location/utils/coordinates';
import {
  ACTIVE_ORDER_STATUSES,
  FINISHED_ORDER_STATUSES,
} from '@/features/orders/utils/order-status';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

import {
  DELIVERY_ITEM_COLUMNS,
  DELIVERY_LIST_COLUMNS,
  DELIVERY_ORDER_COLUMNS,
  PICKUP_STORE_COLUMNS,
  RIDER_COLUMNS,
  parseDeliveryItems,
  parseDeliveryList,
  parseDeliveryOrder,
  parseOffers,
  parsePickupStore,
  parseRiderAccount,
} from '../schemas/dispatch.schema';
import type {
  DeliveryDetailBundle,
  DeliveryListItem,
  DeliveryOffer,
  PickupStore,
  RiderAccount,
} from '../types';

/**
 * Everything a rider does against the database. Row-level security limits each call to the rider's
 * own rows; going online, offers and accepting are database functions that check approval, range
 * and "one delivery at a time" themselves, so none of it can be bent from here.
 */

/** The rider's own registration, or null if they have not registered yet. */
export async function getMyRider(userId: string): Promise<RiderAccount | null> {
  const { data, error } = await supabase
    .from('riders')
    .select(RIDER_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.warn('Could not load rider account', { code: error.code });
    throw error;
  }
  return data ? parseRiderAccount(data) : null;
}

/**
 * Registers the signed-in rider. They start as `pending`; only the platform owner can approve them
 * (the app has no way to write the status, and the database refuses it).
 */
export async function registerAsRider(userId: string): Promise<RiderAccount> {
  const { data, error } = await supabase
    .from('riders')
    .insert({ user_id: userId })
    .select(RIDER_COLUMNS)
    .single();

  if (error) {
    logger.warn('Could not register rider', { code: error.code });
    throw error;
  }
  return parseRiderAccount(data);
}

export interface PresenceInput {
  isOnline: boolean;
  /** Required when going online or pinging; omit when going offline (the last position is kept). */
  coordinates: Coordinates | null;
}

/** Goes online or offline, and reports the position. Also used as the periodic position ping. */
export async function setPresence({ isOnline, coordinates }: PresenceInput): Promise<void> {
  const { error } = await supabase.rpc('set_rider_presence', {
    p_is_online: isOnline,
    p_latitude: coordinates?.latitude ?? null,
    p_longitude: coordinates?.longitude ?? null,
  });

  if (error) {
    logger.warn('Could not update rider presence', { code: error.code, reason: error.message });
    throw error;
  }
}

/** Deliveries this rider could accept right now. Empty when offline or already delivering. */
export async function listOffers(): Promise<DeliveryOffer[]> {
  const { data, error } = await supabase.rpc('list_delivery_offers');

  if (error) {
    logger.warn('Could not load delivery offers', { code: error.code });
    throw error;
  }
  return parseOffers(data);
}

/** First rider to call this gets the delivery; the database tells everyone else it is gone. */
export async function acceptDelivery(orderId: number): Promise<void> {
  const { error } = await supabase.rpc('accept_delivery', { p_order_id: orderId });

  if (error) {
    logger.warn('Accepting the delivery failed', { code: error.code, reason: error.message });
    throw error;
  }
}

/** "active" deliveries are unfinished; "history" ones are delivered or called off. */
export type DeliveryTab = 'active' | 'history';

interface ListDeliveriesInput {
  userId: string;
  tab: DeliveryTab;
  offset: number;
  limit: number;
}

/** The rider's own deliveries for one tab, newest first. */
export async function listDeliveries({
  userId,
  tab,
  offset,
  limit,
}: ListDeliveriesInput): Promise<DeliveryListItem[]> {
  const statuses = tab === 'active' ? ACTIVE_ORDER_STATUSES : FINISHED_ORDER_STATUSES;
  const { data, error } = await supabase
    .from('orders')
    .select(DELIVERY_LIST_COLUMNS)
    .eq('rider_id', userId)
    .in('status', [...statuses])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.warn('Could not load deliveries', { code: error.code });
    throw error;
  }
  return parseDeliveryList(data);
}

/** Where to collect the order. A problem here must not hide the delivery itself. */
async function getPickupStore(storeId: number): Promise<PickupStore | null> {
  const { data, error } = await supabase
    .from('stores')
    .select(PICKUP_STORE_COLUMNS)
    .eq('id', storeId)
    .maybeSingle();

  if (error) {
    logger.warn('Could not load pickup store', { code: error.code });
    return null;
  }
  return data ? parsePickupStore(data) : null;
}

/** One delivery with its items and the store to collect from. Null if it is not this rider's. */
export async function getDeliveryDetail(orderId: number): Promise<DeliveryDetailBundle | null> {
  const orderResult = await supabase
    .from('orders')
    .select(DELIVERY_ORDER_COLUMNS)
    .eq('id', orderId)
    .maybeSingle();

  if (orderResult.error) {
    logger.warn('Could not load delivery', { code: orderResult.error.code });
    throw orderResult.error;
  }
  if (!orderResult.data) return null;
  const order = parseDeliveryOrder(orderResult.data);

  const [items, store] = await Promise.all([
    supabase.from('order_items').select(DELIVERY_ITEM_COLUMNS).eq('order_id', orderId).order('id'),
    getPickupStore(order.storeId),
  ]);

  if (items.error) {
    logger.warn('Could not load delivery items', { code: items.error.code });
    throw items.error;
  }
  return { order, items: parseDeliveryItems(items.data), store };
}
