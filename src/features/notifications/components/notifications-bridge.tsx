import { useOrderRealtime } from '@/features/orders/hooks/use-order-realtime';

import '../notification-handler';
import { useForegroundNotifications } from '../hooks/use-foreground-notifications';
import { useForgetPhoneOnSignOut } from '../hooks/use-forget-phone-on-sign-out';
import { useNotificationTaps } from '../hooks/use-notification-taps';
import { usePushRegistration } from '../hooks/use-push-registration';
import { isPushSupported } from '../services/push.service';

/**
 * Starts everything that keeps the app current without anyone asking: live order updates on every
 * platform, and on phones also push notifications (register, show, open on tap). Renders nothing.
 * Sits once, inside the auth provider, so it knows who is signed in.
 */
export function NotificationsBridge() {
  useOrderRealtime();
  return isPushSupported() ? <PhoneNotifications /> : null;
}

/** Split out so the notification hooks run only where they exist: Android and iPhone. */
function PhoneNotifications() {
  usePushRegistration();
  useNotificationTaps();
  useForegroundNotifications();
  useForgetPhoneOnSignOut();
  return null;
}
