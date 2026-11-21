import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { storeKeys } from '../query-keys';
import { getStore } from '../services/stores.service';
import type { StoreDetails } from '../types';

/**
 * One store. `data` is null when it does not exist or is not visible to this customer.
 * Pass null while the store is not known yet (for example an empty cart); nothing is fetched.
 */
export function useStore(storeId: number | null): UseQueryResult<StoreDetails | null, Error> {
  return useQuery({
    queryKey: storeKeys.detail(storeId ?? 0),
    queryFn: () => (storeId === null ? Promise.resolve(null) : getStore(storeId)),
    enabled: storeId !== null,
  });
}
