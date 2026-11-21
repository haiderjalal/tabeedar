import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  getPermissionState,
  isPushSupported,
  type PermissionState,
} from '../services/push.service';

/**
 * Whether the phone lets the app show notifications, or null while that is not known (and always on
 * the web, which has no push). Read again whenever the app comes back to the front, so it is right
 * after the person returns from the phone's settings.
 */
export function useNotificationPermission(): PermissionState | null {
  const [permission, setPermission] = useState<PermissionState | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;
    let cancelled = false;

    function read(): void {
      void getPermissionState().then((next) => {
        if (!cancelled) setPermission(next);
      });
    }

    read();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') read();
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return permission;
}
