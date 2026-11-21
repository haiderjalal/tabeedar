/**
 * TanStack Query cache keys for the auth feature. Keys include the user id, so one person's cached
 * data can never be shown to the next person who signs in on the same device.
 */
export const authKeys = {
  profile: (userId: string | null) => ['auth', 'profile', userId] as const,
};
