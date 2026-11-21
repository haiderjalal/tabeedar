import type { OrderStatus } from '@/features/orders/utils/order-status';

/** `pending` until the platform owner approves; `suspended` blocks a rider again. */
export type RiderApproval = 'pending' | 'approved' | 'suspended';

/** The signed-in rider's own registration and presence. */
export interface RiderAccount {
  status: RiderApproval;
  isOnline: boolean;
  /** Last reported position; null before the first time the rider went online. */
  latitude: number | null;
  longitude: number | null;
}

/**
 * A delivery a rider could accept right now. Deliberately has no customer name, phone or exact
 * address: those are revealed only after accepting (the database enforces it).
 */
export interface DeliveryOffer {
  orderId: number;
  status: OrderStatus;
  storeName: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffArea: string | null;
  dropoffCity: string;
  /** Straight-line metres from the rider to the store. */
  riderToStoreM: number;
  /** Straight-line metres from the store to the drop-off. */
  storeToDropoffM: number;
  /** Rupees. */
  deliveryFee: number;
  /** Rupees the customer pays in cash. */
  total: number;
  createdAt: string;
}

/** One line of the rider's list of their own deliveries. */
export interface DeliveryListItem {
  id: number;
  status: OrderStatus;
  storeName: string;
  dropoffArea: string | null;
  dropoffCity: string;
  deliveryFee: number;
  total: number;
  createdAt: string;
}

/** The order as the rider who accepted it sees it. */
export interface DeliveryOrder {
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
  latitude: number;
  longitude: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
}

export interface DeliveryItem {
  id: number;
  productName: string;
  quantity: number;
}

/** Where to pick the order up. */
export interface PickupStore {
  name: string;
  phone: string | null;
  addressLine: string;
  area: string | null;
  city: string;
  latitude: number;
  longitude: number;
}

export interface DeliveryDetailBundle {
  order: DeliveryOrder;
  items: DeliveryItem[];
  /** Null if the store can no longer be read (for example, suspended). */
  store: PickupStore | null;
}
