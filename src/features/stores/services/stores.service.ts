import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

import {
  CATEGORY_COLUMNS,
  PRODUCT_COLUMNS,
  STORE_COLUMNS,
  parseCatalog,
  parseStoreDetails,
  parseStoreSummaries,
} from '../schemas/store.schema';
import type { Catalog, StoreDetails, StoreSummary } from '../types';

/**
 * Reading stores and their products. Everything here runs with the signed-in customer's
 * permissions, so row-level security decides what is visible (active stores only).
 */

export interface SearchStoresInput {
  /** Where to measure distances from: the delivery address the customer has chosen. */
  latitude: number;
  longitude: number;
  /** Text to look for in store and product names. Empty means "just list nearby stores". */
  query: string;
  offset: number;
  limit: number;
}

export async function searchStores(input: SearchStoresInput): Promise<StoreSummary[]> {
  const trimmed = input.query.trim();
  const { data, error } = await supabase.rpc('search_stores', {
    p_latitude: input.latitude,
    p_longitude: input.longitude,
    p_query: trimmed === '' ? null : trimmed,
    p_limit: input.limit,
    p_offset: input.offset,
  });

  if (error) {
    logger.warn('Store search failed', { code: error.code });
    throw error;
  }
  return parseStoreSummaries(data);
}

/** The store, or null if it does not exist or the customer cannot see it (suspended, removed). */
export async function getStore(storeId: number): Promise<StoreDetails | null> {
  const { data, error } = await supabase
    .from('stores')
    .select(STORE_COLUMNS)
    .eq('id', storeId)
    .maybeSingle();

  if (error) {
    logger.warn('Could not load store', { code: error.code });
    throw error;
  }
  return data ? parseStoreDetails(data) : null;
}

/** All categories and products of a store, fetched together. */
export async function getCatalog(storeId: number): Promise<Catalog> {
  const [categories, products] = await Promise.all([
    supabase
      .from('categories')
      .select(CATEGORY_COLUMNS)
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true }),
  ]);

  if (categories.error || products.error) {
    const error = categories.error ?? products.error;
    logger.warn('Could not load catalog', { code: error?.code });
    throw error;
  }
  return parseCatalog(categories.data, products.data);
}
