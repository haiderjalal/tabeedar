/**
 * The Android notification channel for order news. It must exist on the phone before a push
 * arrives: Expo tells Android which channel to use, and a notification for a channel that does not
 * exist is not shown at all. The app creates it on every start, before registering for pushes. The
 * same id is in `supabase/functions/_shared/expo-push.ts` (a unit test keeps the two equal).
 */
export const ANDROID_CHANNEL_ID = 'orders';

/** The kinds of notification the server sends (see the `notifications.kind` check in the database). */
export const NOTIFICATION_KINDS = [
  'order_placed',
  'order_accepted',
  'order_rejected',
  'order_ready',
  'order_picked_up',
  'order_delivered',
  'order_cancelled',
  'delivery_available',
  'delivery_cancelled',
] as const;
