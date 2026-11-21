import { isNetworkError, readApiError } from '@/lib/api-error';

/** Keys of `checkout:errors` in the translation files. */
export type PlaceOrderErrorKey =
  | 'storeUnavailable'
  | 'productUnavailable'
  | 'invalidItems'
  | 'invalidLocation'
  | 'network'
  | 'generic';

/** The short codes `place_order` raises in the database (see docs/database.md). */
const MESSAGE_TO_KEY: Record<string, PlaceOrderErrorKey> = {
  store_unavailable: 'storeUnavailable',
  product_unavailable: 'productUnavailable',
  invalid_items: 'invalidItems',
  invalid_location: 'invalidLocation',
};

/**
 * Picks the message to show when placing an order fails. Anything we do not recognise (including a
 * database error that should never reach a person) becomes the generic message.
 */
export function toPlaceOrderErrorKey(error: unknown): PlaceOrderErrorKey {
  if (isNetworkError(error)) return 'network';
  return MESSAGE_TO_KEY[readApiError(error).message] ?? 'generic';
}
