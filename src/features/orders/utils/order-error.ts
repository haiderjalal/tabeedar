import { isNetworkError, readApiError } from '@/lib/api-error';

/** Keys of `orders:errors` in the translation files. */
export type OrderErrorKey = 'invalidTransition' | 'orderNotFound' | 'network' | 'generic';

const MESSAGE_TO_KEY: Record<string, OrderErrorKey> = {
  invalid_transition: 'invalidTransition',
  order_not_found: 'orderNotFound',
};

/** Picks the message to show when changing an order (for customers, cancelling) fails. */
export function toOrderErrorKey(error: unknown): OrderErrorKey {
  if (isNetworkError(error)) return 'network';
  return MESSAGE_TO_KEY[readApiError(error).message] ?? 'generic';
}
