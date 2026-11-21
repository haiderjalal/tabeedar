/** TanStack Query cache keys for the stores feature. */
export const storeKeys = {
  all: ['stores'] as const,
  /** Coordinates are rounded to 4 decimals (about 11 m) so tiny GPS jitter reuses the cache. */
  search: (latitude: number, longitude: number, query: string) =>
    ['stores', 'search', latitude.toFixed(4), longitude.toFixed(4), query] as const,
  detail: (storeId: number) => ['stores', 'detail', storeId] as const,
  catalog: (storeId: number) => ['stores', 'catalog', storeId] as const,
};
