import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

import { logger } from '@/lib/logger';
import type { RealtimeStatus } from '@/lib/realtime/realtime-status';
import { supabase } from '@/lib/supabase/client';

interface OrderChangeSubscription {
  /** The signed-in person; only used to give the channel a name of its own. */
  userId: string;
  /** Called when an order row this person may see was inserted, updated or deleted. */
  onChange: () => void;
  /** Called whenever the connection to live updates changes. */
  onStatus: (status: RealtimeStatus) => void;
}

/**
 * Listens for changes to orders through Supabase Realtime. The database decides who receives which
 * change (row-level security applies to Realtime too), so a customer hears about their own orders, a
 * store about its orders, a rider about the deliveries they hold, and nobody about anyone else's.
 * Returns a function that stops listening.
 *
 * Riders do not hear about *new offers* this way: an offer is an order nobody holds yet, which a
 * rider is not allowed to read. New offers reach them through the push notification and the
 * offers list's own refresh.
 */
export function subscribeToOrderChanges({
  userId,
  onChange,
  onStatus,
}: OrderChangeSubscription): () => void {
  const channel = supabase
    .channel(`orders-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => onChange())
    .subscribe((status) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        onStatus('connected');
        return;
      }
      logger.warn('Live updates are not connected', { status });
      onStatus('down');
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
