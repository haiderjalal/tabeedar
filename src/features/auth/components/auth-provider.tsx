import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { emitSignedOut } from '@/lib/session-events';

import { AuthContext, type AuthContextValue } from '../context/auth-context';
import { authKeys } from '../query-keys';
import { fetchOwnProfile, subscribeToAuthChanges } from '../services/auth.service';
import type { AuthStatus } from '../types';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Keeps track of who is signed in and loads their profile, so the rest of the app can ask
 * `useAuth()` instead of talking to Supabase. Must sit inside the query provider.
 *
 * Two pieces of state are combined here:
 *  - the session (is anyone signed in?), which Supabase restores from device storage
 *  - the profile (who are they, and what role?), fetched with TanStack Query
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  // True until Supabase has reported the saved session (or the lack of one).
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    // The listener fires right away with the restored session, so no separate lookup is needed.
    return subscribeToAuthChanges((event, nextSession) => {
      setSession(nextSession);
      setIsRestoring(false);

      // Drop everything kept for the previous person so it cannot leak to the next one: cached
      // server data here, and data saved on the device (cart, chosen address) via the signal.
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        emitSignedOut();
      }
    });
  }, [queryClient]);

  const userId = session?.user.id ?? null;

  const profileQuery = useQuery({
    queryKey: authKeys.profile(userId),
    queryFn: () => (userId ? fetchOwnProfile(userId) : Promise.resolve(null)),
    enabled: userId !== null,
  });

  const profile = profileQuery.data ?? null;

  let status: AuthStatus;
  if (isRestoring) status = 'loading';
  else if (session === null) status = 'signedOut';
  else if (profileQuery.isPending) status = 'loading';
  else if (profile !== null) status = 'ready';
  // Signed in, but the profile request failed or no profile row exists.
  else status = 'error';

  const value: AuthContextValue = {
    status,
    user: session ? { id: session.user.id, email: session.user.email ?? null } : null,
    profile,
    role: status === 'ready' && profile ? profile.role : null,
    retryProfile: () => {
      void profileQuery.refetch();
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
