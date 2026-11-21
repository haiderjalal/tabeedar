import { removeStoreImage } from '@/features/media/services/media.service';
import { unusedPaths } from '@/features/media/utils/unused-paths';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

import { MY_STORE_COLUMNS, parseMyStore } from '../schemas/shop.schema';
import type { MyStore } from '../types';
import { toShopPayload, type ShopFormValues } from '../utils/shop-payload';

/**
 * The signed-in store owner's own store. Row-level security lets an owner change only their own
 * store, and the database fills in the owner and keeps the status out of reach, so none of this
 * can touch another store or lift a suspension.
 */

/**
 * The owner's store, or null if they have not set one up yet. The filter on `owner_id` matters:
 * every signed-in person can read all active stores, so without it this would return someone else's.
 */
export async function getMyStore(ownerId: string): Promise<MyStore | null> {
  const { data, error } = await supabase
    .from('stores')
    .select(MY_STORE_COLUMNS)
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) {
    logger.warn('Could not load own store', { code: error.code });
    throw error;
  }
  return data ? parseMyStore(data) : null;
}

/**
 * Creates the store (when `previous` is null) or updates it. After an update, pictures the store no
 * longer uses are deleted from Storage; a failure there is only logged.
 */
export async function saveStore(
  values: ShopFormValues,
  previous: MyStore | null,
): Promise<MyStore> {
  const payload = toShopPayload(values, previous?.id ?? null);
  const query =
    previous === null
      ? supabase.from('stores').insert(payload)
      : supabase.from('stores').update(payload).eq('id', previous.id);

  const { data, error } = await query.select(MY_STORE_COLUMNS).single();
  if (error) {
    logger.warn('Could not save store', { code: error.code });
    throw error;
  }
  const saved = parseMyStore(data);

  if (previous !== null) {
    const replaced = unusedPaths(
      [previous.logoPath, previous.coverPath],
      [saved.logoPath, saved.coverPath],
    );
    await Promise.all(replaced.map(removeStoreImage));
  }
  return saved;
}

/** Turns "accepting orders" on or off. A closed store stays visible but cannot take orders. */
export async function setStoreOpen(storeId: number, isOpen: boolean): Promise<MyStore> {
  const { data, error } = await supabase
    .from('stores')
    .update({ is_open: isOpen })
    .eq('id', storeId)
    .select(MY_STORE_COLUMNS)
    .single();

  if (error) {
    logger.warn('Could not change open state', { code: error.code });
    throw error;
  }
  return parseMyStore(data);
}
