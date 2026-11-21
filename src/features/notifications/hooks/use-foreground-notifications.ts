import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { orderKeys } from '@/features/orders/query-keys';

/**
 * When a notification arrives while the app is open, the order data behind it has just changed, so
 * refresh it straight away. This also covers a rider's "new delivery nearby", which live updates
 * cannot announce (a rider may not read an order nobody holds yet).
 */
export function useForegroundNotifications(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    });
    return () => subscription.remove();
  }, [queryClient]);
}
