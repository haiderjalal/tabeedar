import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

import { ADDRESS_COLUMNS, parseAddress, parseAddresses } from '../schemas/address.schema';
import type { Address } from '../types';
import { toAddressPayload, type AddressFormValues } from '../utils/address-payload';

/**
 * The signed-in customer's saved addresses. Row-level security limits every call here to the
 * customer's own rows, and the database fills in the owner, so none of this can touch anyone else's.
 */

/** Default address first, then newest first. */
export async function listAddresses(): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select(ADDRESS_COLUMNS)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    logger.warn('Could not load addresses', { code: error.code });
    throw error;
  }
  return parseAddresses(data);
}

/** Creates the address, or updates it when `addressId` is given. */
export async function saveAddress(values: AddressFormValues, addressId?: number): Promise<Address> {
  const payload = toAddressPayload(values);
  const query =
    addressId === undefined
      ? supabase.from('addresses').insert(payload)
      : supabase.from('addresses').update(payload).eq('id', addressId);

  const { data, error } = await query.select(ADDRESS_COLUMNS).single();
  if (error) {
    logger.warn('Could not save address', { code: error.code });
    throw error;
  }
  return parseAddress(data);
}

export async function deleteAddress(addressId: number): Promise<void> {
  const { error } = await supabase.from('addresses').delete().eq('id', addressId);
  if (error) {
    logger.warn('Could not delete address', { code: error.code });
    throw error;
  }
}
