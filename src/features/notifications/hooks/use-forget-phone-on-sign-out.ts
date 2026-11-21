import { useEffect } from 'react';

import { logger } from '@/lib/logger';
import { onBeforeSignOut } from '@/lib/session-events';

import { removeDeviceToken, takeRegisteredToken } from '../services/push.service';

/**
 * Just before someone signs out, removes this phone's token from their account, so their order
 * notifications stop arriving on a phone that someone else may use next. This must happen while they
 * are still signed in (the database only lets the owner remove a token). If it fails (no connection),
 * the token is moved to whoever registers this phone next, so the leftover window is short.
 */
export function useForgetPhoneOnSignOut(): void {
  useEffect(
    () =>
      onBeforeSignOut(async () => {
        const token = takeRegisteredToken();
        if (token === null) return;
        try {
          await removeDeviceToken(token);
        } catch (error) {
          logger.warn('Could not forget this phone before signing out', {
            message: error instanceof Error ? error.message : 'unknown',
          });
        }
      }),
    [],
  );
}
