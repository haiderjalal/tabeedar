import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { debounce } from '@/lib/debounce';
import { setRealtimeStatus } from '@/lib/realtime/realtime-status';

import { orderKeys } from '../query-keys';
import { subscribeToOrderChanges } from '../services/order-realtime.service';

/** Changes that arrive together (accepting an order touches several rows) cause one refresh. */
const REFRESH_DEBOUNCE_MS = 400;

/**
 * While someone is signed in, refreshes every order screen the moment an order they may see changes.
 * Order data is only ever refreshed through the normal queries, so the screens need no changes: a
 * change simply makes them re-read. Also reports whether live updates are connected, which lets the
 * screens slow their polling down while it is (see `realtime-status`), and refreshes once after a
 * lost connection comes back, to catch up on anything missed.
 */
export function useOrderRealtime(): void {
  const queryClient = useQueryClient();
  const { status, user } = useAuth();
  const userId = status === 'ready' ? (user?.id ?? null) : null;

  useEffect(() => {
    if (userId === null) return;

    const refresh = debounce(() => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    }, REFRESH_DEBOUNCE_MS);

    let hasBeenConnected = false;
    const stop = subscribeToOrderChanges({
      userId,
      onChange: refresh,
      onStatus: (next) => {
        setRealtimeStatus(next);
        if (next !== 'connected') {
          // Refreshing re-evaluates every screen's polling pace, so they go back to the fast pace
          // now instead of at their next (up to a minute away) scheduled check.
          refresh();
          return;
        }
        // A later "connected" means a connection was lost and restored: catch up on what was missed.
        if (hasBeenConnected) refresh();
        hasBeenConnected = true;
      },
    });

    return () => {
      refresh.cancel();
      stop();
      // Back to the fast, safe pace until the next person's connection is up.
      setRealtimeStatus('connecting');
    };
  }, [userId, queryClient]);
}
