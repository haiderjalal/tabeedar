import { z } from 'zod';

import type {
  OrderDetails,
  OrderEvent,
  OrderItem,
  OrderListItem,
  RiderContact,
  StoreOrderListItem,
} from '../types';
import { isOrderStatus, type OrderStatus } from '../utils/order-status';

/** Rows from the database, checked where they enter the app (ADR 014). */

const status = z.custom<OrderStatus>(isOrderStatus);

const orderListRow = z.object({
  id: z.number().int(),
  store_id: z.number().int(),
  store_name: z.string(),
  status,
  total: z.number(),
  created_at: z.string(),
});

const storeOrderListRow = z.object({
  id: z.number().int(),
  status,
  recipient_name: z.string(),
  total: z.number(),
  created_at: z.string(),
});

const orderRow = z.object({
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
  subtotal: z.number(),
  delivery_fee: z.number(),
  total: z.number(),
  distance_m: z.number(),
  rider_id: z.string().nullable(),
  created_at: z.string(),
});

const itemRow = z.object({
  id: z.number().int(),
  product_name: z.string(),
  unit_price: z.number(),
  quantity: z.number().int(),
  line_total: z.number(),
});

const eventRow = z.object({
  id: z.number().int(),
  event_type: z.enum(['status_changed', 'rider_assigned']),
  status,
  note: z.string().nullable(),
  created_at: z.string(),
});

const riderRow = z.object({
  full_name: z.string().nullable(),
  phone: z.string().nullable(),
});

/** Columns to request, next to the schemas they must match. */
export const ORDER_LIST_COLUMNS = 'id, store_id, store_name, status, total, created_at';
export const STORE_ORDER_LIST_COLUMNS = 'id, status, recipient_name, total, created_at';
export const ORDER_COLUMNS =
  'id, store_id, store_name, status, recipient_name, recipient_phone, address_line, area, city, instructions, notes, subtotal, delivery_fee, total, distance_m, rider_id, created_at';
export const ORDER_ITEM_COLUMNS = 'id, product_name, unit_price, quantity, line_total';
export const ORDER_EVENT_COLUMNS = 'id, event_type, status, note, created_at';
export const RIDER_CONTACT_COLUMNS = 'full_name, phone';

export function parseOrderList(rows: unknown): OrderListItem[] {
  return z
    .array(orderListRow)
    .parse(rows)
    .map((row) => ({
      id: row.id,
      storeId: row.store_id,
      storeName: row.store_name,
      status: row.status,
      total: row.total,
      createdAt: row.created_at,
    }));
}

export function parseStoreOrderList(rows: unknown): StoreOrderListItem[] {
  return z
    .array(storeOrderListRow)
    .parse(rows)
    .map((row) => ({
      id: row.id,
      status: row.status,
      recipientName: row.recipient_name,
      total: row.total,
      createdAt: row.created_at,
    }));
}

export function parseOrderDetails(row: unknown): OrderDetails {
  const parsed = orderRow.parse(row);
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
    subtotal: parsed.subtotal,
    deliveryFee: parsed.delivery_fee,
    total: parsed.total,
    distanceM: parsed.distance_m,
    riderId: parsed.rider_id,
    createdAt: parsed.created_at,
  };
}

export function parseOrderItems(rows: unknown): OrderItem[] {
  return z
    .array(itemRow)
    .parse(rows)
    .map((row) => ({
      id: row.id,
      productName: row.product_name,
      unitPrice: row.unit_price,
      quantity: row.quantity,
      lineTotal: row.line_total,
    }));
}

export function parseOrderEvents(rows: unknown): OrderEvent[] {
  return z
    .array(eventRow)
    .parse(rows)
    .map((row) => ({
      id: row.id,
      type: row.event_type,
      status: row.status,
      note: row.note,
      createdAt: row.created_at,
    }));
}

export function parseRiderContact(row: unknown): RiderContact {
  const parsed = riderRow.parse(row);
  return { name: parsed.full_name, phone: parsed.phone };
}
