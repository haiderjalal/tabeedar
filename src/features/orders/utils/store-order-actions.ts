import type { OrderStatus } from './order-status';

/** The statuses a store can move an order to. Each is also a key in `storeOrders:actions`. */
export type StoreActionTarget = Extract<
  OrderStatus,
  'accepted' | 'rejected' | 'preparing' | 'ready' | 'cancelled'
>;

/** One button a store can press on an order. */
export interface StoreOrderAction {
  /** The status the order moves to. */
  to: StoreActionTarget;
  /** `danger` for moves that end the order for the customer (rejecting, cancelling). */
  tone: 'primary' | 'secondary' | 'danger';
  /** Ask for an optional reason first. Only the moves that end the order do. */
  asksForNote: boolean;
}

const ACCEPT: StoreOrderAction = { to: 'accepted', tone: 'primary', asksForNote: false };
const REJECT: StoreOrderAction = { to: 'rejected', tone: 'danger', asksForNote: true };
const PREPARE: StoreOrderAction = { to: 'preparing', tone: 'primary', asksForNote: false };
const READY_PRIMARY: StoreOrderAction = { to: 'ready', tone: 'primary', asksForNote: false };
const READY_SECONDARY: StoreOrderAction = { to: 'ready', tone: 'secondary', asksForNote: false };
const CANCEL: StoreOrderAction = { to: 'cancelled', tone: 'danger', asksForNote: true };

/**
 * What a store may do with an order in the given status. This only decides which buttons to show;
 * the real rulebook is `order_transition_allowed` in the database, which refuses anything else.
 * Keep the two in step (a unit test checks the moves listed here against the documented ones).
 */
export function storeActionsFor(status: OrderStatus): StoreOrderAction[] {
  switch (status) {
    case 'placed':
      return [ACCEPT, REJECT];
    case 'accepted':
      return [PREPARE, READY_SECONDARY, CANCEL];
    case 'preparing':
      return [READY_PRIMARY, CANCEL];
    case 'ready':
      return [CANCEL];
    default:
      // picked_up, delivered, rejected, cancelled: the order is with the rider or finished.
      return [];
  }
}
