import type { OrderStatus } from './utils/order-status';

/** One line of "My orders". */
export interface OrderListItem {
  id: number;
  storeId: number;
  storeName: string;
  status: OrderStatus;
  /** Rupees. */
  total: number;
  createdAt: string;
}

/** One line of the store's order list. */
export interface StoreOrderListItem {
  id: number;
  status: OrderStatus;
  recipientName: string;
  /** Rupees. */
  total: number;
  createdAt: string;
}

/** A single order with everything the customer sees about it. */
export interface OrderDetails {
  id: number;
  storeId: number;
  storeName: string;
  status: OrderStatus;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  area: string | null;
  city: string;
  instructions: string | null;
  notes: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  distanceM: number;
  /** Set once a rider has accepted the delivery. */
  riderId: string | null;
  createdAt: string;
}

/** An item as it was when ordered: its name and price are a copy, so later edits do not change it. */
export interface OrderItem {
  id: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type OrderEventType = 'status_changed' | 'rider_assigned';

/** One step in the order's history. */
export interface OrderEvent {
  id: number;
  type: OrderEventType;
  /** The order's status after this step. */
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

/** How to reach the rider, visible to the customer while the delivery is in progress. */
export interface RiderContact {
  name: string | null;
  phone: string | null;
}

export interface OrderDetailBundle {
  order: OrderDetails;
  items: OrderItem[];
  events: OrderEvent[];
  rider: RiderContact | null;
}
