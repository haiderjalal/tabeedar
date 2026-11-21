/**
 * TanStack Query cache keys for the shop feature. The key holds the owner's id because the store is
 * looked up by owner, so a different person signing in never sees the previous owner's store.
 */
export const shopKeys = {
  mine: (ownerId: string | null) => ['shop', 'mine', ownerId] as const,
};
