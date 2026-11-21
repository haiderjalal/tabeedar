import { isNetworkError, readApiError } from '@/lib/api-error';

/** Keys of `catalog:errors` in the translation files. */
export type CatalogErrorKey = 'duplicateName' | 'network' | 'generic';

/** Postgres' "unique violation". For categories it means the store already has that name. */
const UNIQUE_VIOLATION = '23505';

/** Picks the message to show when saving or deleting a category or product fails. */
export function toCatalogErrorKey(error: unknown): CatalogErrorKey {
  if (isNetworkError(error)) return 'network';
  if (readApiError(error).code === UNIQUE_VIOLATION) return 'duplicateName';
  return 'generic';
}
