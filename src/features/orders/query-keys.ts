/** TanStack Query cache keys for the orders feature. Everything starts with `orders`, so one call can refresh all of it. */
export const orderKeys = {
  all: ['orders'] as const,
  list: ['orders', 'list'] as const,
  detail: (orderId: number) => ['orders', 'detail', orderId] as const,
  /** A store's order list: `tab` is "active" or "history". */
  storeList: (storeId: number, tab: string) => ['orders', 'store', storeId, tab] as const,
  /** How many orders are waiting for the store to answer (the tab badge). */
  storeNewCount: (storeId: number) => ['orders', 'store', storeId, 'new-count'] as const,
};
