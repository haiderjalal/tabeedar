import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { runBeforeSignOut } from '@/lib/session-events';

import { signOut } from '../services/auth.service';

/**
 * Signs out of this device. First lets other features do what needs the person still signed in (such
 * as forgetting this phone's notification token); that never blocks signing out. The auth provider
 * clears cached data when the session ends.
 */
export function useSignOut(): UseMutationResult<void, Error, void> {
  return useMutation({
    mutationFn: async () => {
      await runBeforeSignOut();
      await signOut();
    },
  });
}
