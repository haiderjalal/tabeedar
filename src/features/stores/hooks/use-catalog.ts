import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { storeKeys } from '../query-keys';
import { getCatalog } from '../services/stores.service';
import type { Catalog } from '../types';

/** A store's categories and products. Refreshed in the background so stock changes show up. */
export function useCatalog(storeId: number): UseQueryResult<Catalog, Error> {
  return useQuery({
    queryKey: storeKeys.catalog(storeId),
    queryFn: () => getCatalog(storeId),
  });
}
