/**
 * Whether live updates (Supabase Realtime) are working right now, so polling can step aside when they
 * are and take over when they are not.
 *
 * While Realtime is connected, every order change reaches the app within a moment, and polling
 * becomes a slow safety net. Until it is connected (starting up, no connection, a server problem)
 * the screens poll at their normal fast pace, exactly as they did before Realtime existed. That keeps
 * a broken Realtime connection from ever making the app feel stale.
 */
export type RealtimeStatus = 'connecting' | 'connected' | 'down';

/** How often screens re-check while Realtime is connected. A safety net, not the main way. */
export const BACKUP_REFRESH_MS = 60_000;

let current: RealtimeStatus = 'connecting';

export function setRealtimeStatus(next: RealtimeStatus): void {
  current = next;
}

export function getRealtimeStatus(): RealtimeStatus {
  return current;
}

/** Pure rule: how long to wait between checks, given Realtime's state and the normal fast pace. */
export function pickRefreshInterval(status: RealtimeStatus, fastMs: number): number {
  return status === 'connected' ? Math.max(fastMs, BACKUP_REFRESH_MS) : fastMs;
}

/** The interval a screen should poll at right now. Pass the normal fast pace. */
export function orderRefreshInterval(fastMs: number): number {
  return pickRefreshInterval(current, fastMs);
}
