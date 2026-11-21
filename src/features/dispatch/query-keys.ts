/**
 * TanStack Query cache keys for the rider area.
 *
 * The account key holds the user id, so a different person signing in on the same phone never sees
 * the previous rider's registration. Offers and deliveries start with `orders`, like every other
 * order key, so refreshing `orderKeys.all` (done after any order status change) also refreshes them.
 */
export const dispatchKeys = {
  mine: (userId: string | null) => ['rider', 'mine', userId] as const,
  offers: ['orders', 'rider', 'offers'] as const,
  /** `tab` is "active" or "history". */
  deliveries: (tab: string) => ['orders', 'rider', 'deliveries', tab] as const,
  delivery: (orderId: number) => ['orders', 'rider', 'delivery', orderId] as const,
};
