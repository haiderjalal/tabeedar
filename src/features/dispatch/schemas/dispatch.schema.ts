import { z } from 'zod';

import { isOrderStatus, type OrderStatus } from '@/features/orders/utils/order-status';

import type {
  DeliveryItem,
  DeliveryListItem,
  DeliveryOffer,
  DeliveryOrder,
  PickupStore,
  RiderAccount,
} from '../types';

/** Rows from the database, checked where they enter the app (ADR 014). */

const status = z.custom<OrderStatus>(isOrderStatus);

const riderRow = z.object({
  status: z.enum(['pending', 'approved', 'suspended']),
  is_online: z.boolean(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

const offerRow = z.object({
  order_id: z.number().int(),
  status,
  store_name: z.string(),
  pickup_address: z.string(),
  pickup_latitude: z.number(),
  pickup_longitude: z.number(),
  dropoff_area: z.string().nullable(),
  dropoff_city: z.string(),
  rider_to_store_m: z.number(),
  store_to_dropoff_m: z.number(),
  delivery_fee: z.number(),
  total: z.number(),
  created_at: z.string(),
});

const deliveryListRow = z.object({
  id: z.number().int(),
  status,
  store_name: z.string(),
  area: z.string().nullable(),
  city: z.string(),
  delivery_fee: z.number(),
  total: z.number(),
  created_at: z.string(),
});

const deliveryOrderRow = z.object({
  id: z.number().int(),
  store_id: z.number().int(),
  store_name: z.string(),
  status,
  recipient_name: z.string(),
  recipient_phone: z.string(),
  address_line: z.string(),
  area: z.string().nullable(),
  city: z.string(),
  instructions: z.string().nullable(),
  notes: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  subtotal: z.number(),
  delivery_fee: z.number(),
  total: z.number(),
  created_at: z.string(),
});

const itemRow = z.object({
  id: z.number().int(),
  product_name: z.string(),
  quantity: z.number().int(),
});

const pickupStoreRow = z.object({
  name: z.string(),
  phone: z.string().nullable(),
  address_line: z.string(),
  area: z.string().nullable(),
  city: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

/** Columns to request, next to the schemas they must match. Never `select *`. */
export const RIDER_COLUMNS = 'status, is_online, latitude, longitude';
export const DELIVERY_LIST_COLUMNS =
  'id, status, store_name, area, city, delivery_fee, total, created_at';
export const DELIVERY_ORDER_COLUMNS =
  'id, store_id, store_name, status, recipient_name, recipient_phone, address_line, area, city, instructions, notes, latitude, longitude, subtotal, delivery_fee, total, created_at';
export const DELIVERY_ITEM_COLUMNS = 'id, product_name, quantity';
export const PICKUP_STORE_COLUMNS = 'name, phone, address_line, area, city, latitude, longitude';

export function parseRiderAccount(row: unknown): RiderAccount {
  const parsed = riderRow.parse(row);
  return {
    status: parsed.status,
    isOnline: parsed.is_online,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
  };
}

export function parseOffers(rows: unknown): DeliveryOffer[] {
  return z
    .array(offerRow)
    .parse(rows)
    .map((row) => ({
      orderId: row.order_id,
      status: row.status,
      storeName: row.store_name,
      pickupAddress: row.pickup_address,
      pickupLatitude: row.pickup_latitude,
      pickupLongitude: row.pickup_longitude,
      dropoffArea: row.dropoff_area,
      dropoffCity: row.dropoff_city,
      riderToStoreM: row.rider_to_store_m,
      storeToDropoffM: row.store_to_dropoff_m,
      deliveryFee: row.delivery_fee,
      total: row.total,
      createdAt: row.created_at,
    }));
}

export function parseDeliveryList(rows: unknown): DeliveryListItem[] {
  return z
    .array(deliveryListRow)
    .parse(rows)
    .map((row) => ({
      id: row.id,
      status: row.status,
      storeName: row.store_name,
      dropoffArea: row.area,
      dropoffCity: row.city,
      deliveryFee: row.delivery_fee,
      total: row.total,
      createdAt: row.created_at,
    }));
}

export function parseDeliveryOrder(row: unknown): DeliveryOrder {
  const parsed = deliveryOrderRow.parse(row);
  return {
    id: parsed.id,
    storeId: parsed.store_id,
    storeName: parsed.store_name,
    status: parsed.status,
    recipientName: parsed.recipient_name,
    recipientPhone: parsed.recipient_phone,
    addressLine: parsed.address_line,
    area: parsed.area,
    city: parsed.city,
    instructions: parsed.instructions,
    notes: parsed.notes,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    subtotal: parsed.subtotal,
    deliveryFee: parsed.delivery_fee,
    total: parsed.total,
    createdAt: parsed.created_at,
  };
}

export function parseDeliveryItems(rows: unknown): DeliveryItem[] {
  return z
    .array(itemRow)
    .parse(rows)
    .map((row) => ({ id: row.id, productName: row.product_name, quantity: row.quantity }));
}

export function parsePickupStore(row: unknown): PickupStore {
  const parsed = pickupStoreRow.parse(row);
  return {
    name: parsed.name,
    phone: parsed.phone,
    addressLine: parsed.address_line,
    area: parsed.area,
    city: parsed.city,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
  };
}
