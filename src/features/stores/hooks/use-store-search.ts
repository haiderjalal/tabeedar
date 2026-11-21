import {
  keepPreviousData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
  type InfiniteData,
} from '@tanstack/react-query';

import { storeKeys } from '../query-keys';
import { searchStores } from '../services/stores.service';
import type { StoreSummary } from '../types';

export const STORES_PAGE_SIZE = 20;

interface UseStoreSearchInput {
  /** The delivery address position; the search waits until there is one. */
  location: { latitude: number; longitude: number } | null;
  /** Search text. Pass it already debounced. */
  query: string;
}

/**
 * Pages of stores near an address, optionally filtered by text. Use `fetchNextPage` when the list
 * scrolls near its end; `hasNextPage` turns false after a short page.
 */
export function useStoreSearch({
  location,
  query,
}: UseStoreSearchInput): UseInfiniteQueryResult<InfiniteData<StoreSummary[], number>, Error> {
  return useInfiniteQuery({
    queryKey: storeKeys.search(location?.latitude ?? 0, location?.longitude ?? 0, query),
    enabled: location !== null,
    // While a new search loads, keep showing the previous results instead of flashing a spinner.
    placeholderData: keepPreviousData,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      location === null
        ? Promise.resolve([])
        : searchStores({ ...location, query, offset: pageParam, limit: STORES_PAGE_SIZE }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < STORES_PAGE_SIZE ? undefined : allPages.length * STORES_PAGE_SIZE,
  });
}
