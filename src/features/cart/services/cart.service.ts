import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

import type { LiveProduct } from '../logic/cart-view';
import { LIVE_PRODUCT_COLUMNS, parseLiveProducts } from '../schemas/live-product.schema';

/**
 * The current price and availability of the products in the cart. A product missing from the
 * answer no longer exists or is no longer visible, which the cart treats as unavailable.
 */
export async function getLiveProducts(productIds: readonly number[]): Promise<LiveProduct[]> {
  if (productIds.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select(LIVE_PRODUCT_COLUMNS)
    .in('id', [...productIds]);

  if (error) {
    logger.warn('Could not check cart products', { code: error.code });
    throw error;
  }
  return parseLiveProducts(data);
}
