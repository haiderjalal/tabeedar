import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { logger } from '@/lib/logger';

import {
  ensureNotificationChannel,
  fetchExpoPushToken,
  getPermissionState,
  isPushSupported,
  rememberRegisteredToken,
  requestPermission,
  saveDeviceToken,
} from '../services/push.service';

/**
 * Once someone is signed in on a phone: makes sure notifications can be shown (channel, permission),
 * gets the phone's push token and tells the database, together with the language the phone is using
 * right now. It runs again when the language changes (so notifications follow the language switch)
 * and each time the app starts (a token can change). It never blocks anything: a refused
 * permission or a failed request is logged and the app carries on without notifications.
 */
export function usePushRegistration(): void {
  const { status, user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation('notifications');
  const userId = status === 'ready' ? (user?.id ?? null) : null;

  useEffect(() => {
    if (!isPushSupported() || userId === null) return;
    let cancelled = false;

    async function register(): Promise<void> {
      // First, so the channel exists before the token (and so before the first push) does.
      await ensureNotificationChannel(t('channelName'));

      let permission = await getPermissionState();
      // The system prompt appears here, once; a person who said no is not asked again.
      if (permission === 'undetermined') permission = await requestPermission();
      if (permission !== 'granted' || cancelled) return;

      const token = await fetchExpoPushToken();
      if (token === null || cancelled) return;

      await saveDeviceToken(token, language);
      rememberRegisteredToken(token);
    }

    register().catch((error: unknown) => {
      logger.warn('Push registration failed', {
        message: error instanceof Error ? error.message : 'unknown',
      });
    });

    return () => {
      cancelled = true;
    };
  }, [userId, language, t]);
}
