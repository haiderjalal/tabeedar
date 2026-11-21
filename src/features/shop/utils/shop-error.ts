import { isNetworkError, readApiError } from '@/lib/api-error';

/** Keys of `shop:errors` in the translation files. */
export type ShopErrorKey = 'alreadyHasStore' | 'network' | 'generic';

/** Postgres' "unique violation". For stores it means the account already has its one store. */
const UNIQUE_VIOLATION = '23505';

/** Picks the message to show when saving the store or its open/closed switch fails. */
export function toShopErrorKey(error: unknown): ShopErrorKey {
  if (isNetworkError(error)) return 'network';
  if (readApiError(error).code === UNIQUE_VIOLATION) return 'alreadyHasStore';
  return 'generic';
}
