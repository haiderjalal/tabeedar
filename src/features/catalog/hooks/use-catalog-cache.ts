import { useQueryClient, type QueryClient } from '@tanstack/react-query';

import { storeKeys } from '@/features/stores/query-keys';
import type { Catalog } from '@/features/stores/types';

interface CatalogCache {
  queryClient: QueryClient;
  queryKey: ReturnType<typeof storeKeys.catalog>;
  /**
   * Applies a change to the cached catalog so the screen updates at once, then re-reads the catalog
   * in the background to confirm (not awaited: nothing waits for the refresh).
   */
  update: (change: (catalog: Catalog) => Catalog) => void;
}

/** One store's cached catalog, shared by the category and product mutations. */
export function useCatalogCache(storeId: number): CatalogCache {
  const queryClient = useQueryClient();
  const queryKey = storeKeys.catalog(storeId);

  return {
    queryClient,
    queryKey,
    update: (change) => {
      queryClient.setQueryData<Catalog>(queryKey, (catalog) =>
        catalog ? change(catalog) : catalog,
      );
      void queryClient.invalidateQueries({ queryKey });
    },
  };
}
