import { z } from 'zod';

import type { LiveProduct } from '../logic/cart-view';

const liveProductRow = z.object({
  id: z.number().int(),
  price: z.number().nonnegative(),
  is_available: z.boolean(),
});

export const LIVE_PRODUCT_COLUMNS = 'id, price, is_available';

export function parseLiveProducts(rows: unknown): LiveProduct[] {
  return z
    .array(liveProductRow)
    .parse(rows)
    .map((row) => ({ id: row.id, price: row.price, isAvailable: row.is_available }));
}
