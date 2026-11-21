import { isNetworkError, readApiError } from '@/lib/api-error';

/** Keys of `rider:errors` in the translation files. */
export type DispatchErrorKey =
  | 'deliveryUnavailable'
  | 'alreadyDelivering'
  | 'notAvailable'
  | 'notApproved'
  | 'locationRequired'
  | 'invalidTransition'
  | 'orderNotFound'
  | 'network'
  | 'generic';

/** The database's short error codes (see docs/database.md) and the message each one gets. */
const MESSAGE_TO_KEY: Record<string, DispatchErrorKey> = {
  delivery_unavailable: 'deliveryUnavailable',
  already_delivering: 'alreadyDelivering',
  rider_not_available: 'notAvailable',
  rider_not_approved: 'notApproved',
  location_required: 'locationRequired',
  invalid_location: 'locationRequired',
  invalid_transition: 'invalidTransition',
  order_not_found: 'orderNotFound',
};

/** Picks the message to show when going online, accepting or moving a delivery fails. */
export function toDispatchErrorKey(error: unknown): DispatchErrorKey {
  if (isNetworkError(error)) return 'network';
  return MESSAGE_TO_KEY[readApiError(error).message] ?? 'generic';
}
