import { z } from 'zod';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

/**
 * The two database functions behind checkout. The database does the maths (see docs/database.md):
 * the app never sends a price, and the fee shown here comes from the same function that
 * `place_order` uses, so the number the customer sees is the number they pay.
 */

export interface DeliveryQuote {
  distanceM: number;
  /** Rupees. */
  deliveryFee: number;
}

const quoteRow = z.object({ distance_m: z.number(), delivery_fee: z.number() });

/** Distance and fee from a store to a position, or null if the store is not available. */
export async function quoteDeliveryFee(
  storeId: number,
  latitude: number,
  longitude: number,
): Promise<DeliveryQuote | null> {
  const { data, error } = await supabase.rpc('quote_delivery_fee', {
    p_store_id: storeId,
    p_latitude: latitude,
    p_longitude: longitude,
  });

  if (error) {
    logger.warn('Could not quote the delivery fee', { code: error.code });
    throw error;
  }

  const rows = z.array(quoteRow).parse(data);
  const row = rows[0];
  return row ? { distanceM: row.distance_m, deliveryFee: row.delivery_fee } : null;
}

export interface PlaceOrderInput {
  storeId: number;
  /** Only product and quantity. Prices are read from the database. */
  items: { productId: number; quantity: number }[];
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  area: string | null;
  city: string;
  instructions: string | null;
  latitude: number;
  longitude: number;
  notes: string | null;
  /** One per checkout attempt: sending the same key twice returns the same order. */
  idempotencyKey: string;
}

/** Places the order and returns its number. */
export async function placeOrder(input: PlaceOrderInput): Promise<number> {
  const { data, error } = await supabase.rpc('place_order', {
    p_store_id: input.storeId,
    p_items: input.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
    p_recipient_name: input.recipientName,
    p_recipient_phone: input.recipientPhone,
    p_address_line: input.addressLine,
    p_area: input.area,
    p_city: input.city,
    p_instructions: input.instructions,
    p_latitude: input.latitude,
    p_longitude: input.longitude,
    p_notes: input.notes,
    p_idempotency_key: input.idempotencyKey,
  });

  if (error) {
    // The message is a short code such as "store_unavailable", never personal data.
    logger.warn('Placing the order failed', { code: error.code, reason: error.message });
    throw error;
  }
  return z.number().int().positive().parse(data);
}
