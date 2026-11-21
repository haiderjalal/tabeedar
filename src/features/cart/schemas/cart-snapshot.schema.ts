import { z } from 'zod';

import { MAX_LINE_QUANTITY } from '../logic/cart.logic';

/**
 * The shape of a cart saved on the device. Stored data can be old, edited or corrupted, so it is
 * checked when the app starts; anything that does not fit is thrown away rather than risking a
 * crash on the cart screen.
 */
export const cartSnapshotSchema = z
  .object({
    storeId: z.number().int().positive().nullable(),
    storeName: z.string().nullable(),
    lines: z.array(
      z.object({
        productId: z.number().int().positive(),
        name: z.string().min(1),
        unitPrice: z.number().nonnegative(),
        quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
      }),
    ),
  })
  // A cart with items must know which store it belongs to.
  .refine((cart) => cart.lines.length === 0 || (cart.storeId !== null && cart.storeName !== null), {
    error: 'A cart with items needs a store',
  })
  // The same product must not appear on two lines.
  .refine((cart) => new Set(cart.lines.map((line) => line.productId)).size === cart.lines.length, {
    error: 'A product appears twice',
  });
