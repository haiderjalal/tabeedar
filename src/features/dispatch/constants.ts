/**
 * How often the rider screens check for news. Riders keep the app open while they work, so offers
 * and delivery changes have to appear without pulling to refresh.
 *
 * The deliveries and the delivery screen use this only while live updates are not connected (they
 * slow to a safety net otherwise; see `realtime-status`). The offers list always uses it: an offer
 * is an order nobody holds yet, which a rider may not read, so live updates cannot announce it. A
 * "new delivery nearby" notification covers a rider whose app is open on another screen.
 */
export const RIDER_REFRESH_MS = 10_000;

/** How often an approval request is re-checked while the rider waits for the owner's decision. */
export const APPROVAL_CHECK_MS = 30_000;

/**
 * How often an online rider's position is sent. It decides which stores offer them deliveries, and
 * about a minute is fresh enough for a 5 km radius. Position is only sent while the app is open
 * (decided with the owner; background tracking is not built).
 */
export const PRESENCE_PING_MS = 60_000;
