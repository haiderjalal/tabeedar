/**
 * Maximum lengths for a store's text fields. They match the check constraints on the `stores`
 * table. The address fields use the same limits as customer addresses, so those are shared.
 */
export {
  MAX_ADDRESS_LINE_LENGTH,
  MAX_AREA_LENGTH,
  MAX_CITY_LENGTH,
} from '@/features/addresses/constants';

export const MAX_STORE_NAME_LENGTH = 120;
export const MAX_STORE_DESCRIPTION_LENGTH = 1000;
