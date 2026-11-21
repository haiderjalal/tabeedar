import * as Notifications from 'expo-notifications';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { parseNotificationPayload } from '../schemas/notification-payload';
import { routeForNotification } from '../utils/notification-route';

/**
 * Opens the right screen when the person taps a notification, whether the app was closed, in the
 * background or open. Waits until the person is signed in with a known role and the app's navigation
 * is ready (a tap that starts the app arrives before either), and handles each tap once.
 */
export function useNotificationTaps(): void {
  const { status, role } = useAuth();
  const router = useRouter();
  const navigationReady = useRootNavigationState()?.key !== undefined;
  const response = Notifications.useLastNotificationResponse();
  const handledIdentifier = useRef<string | null>(null);

  useEffect(() => {
    if (!response || status !== 'ready' || role === null || !navigationReady) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const identifier = response.notification.request.identifier;
    if (handledIdentifier.current === identifier) return;
    handledIdentifier.current = identifier;

    const payload = parseNotificationPayload(response.notification.request.content.data);
    const destination = payload ? routeForNotification(role, payload) : null;
    if (destination !== null) router.push(destination);
  }, [response, status, role, navigationReady, router]);
}
