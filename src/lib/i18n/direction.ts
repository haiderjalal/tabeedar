import { reloadAppAsync } from 'expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { I18nManager, Platform } from 'react-native';

import { logger } from '@/lib/logger';

import { LANGUAGES, type LanguageCode } from './config';

/**
 * Expo Go resets the native RTL flag every time it opens a project, so a restart can
 * never apply a direction change there. Seeing mirrored layouts requires a development
 * build (or setting the phone's own language to Urdu).
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Applies the layout direction that belongs to `language`.
 *
 * @returns true when the native direction changed, meaning the app must restart before
 * the mirrored (or un-mirrored) layout becomes visible.
 */
export function applyLanguageDirection(language: LanguageCode): boolean {
  const shouldBeRTL = LANGUAGES[language].isRTL;

  if (Platform.OS === 'web') {
    // The web has no native RTL flag; the browser mirrors layouts from the root `dir`.
    document.documentElement.dir = shouldBeRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    return false;
  }

  // Saved natively, so every later launch starts with the right direction already set.
  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);
  return I18nManager.isRTL !== shouldBeRTL;
}

/**
 * Restarts the app so a changed layout direction takes effect.
 * Only called after an explicit user action, never at startup, to avoid reload loops.
 */
export async function restartToApplyDirection(): Promise<void> {
  if (isExpoGo) {
    logger.warn('Layout direction changes need a development build; not restarting in Expo Go.');
    return;
  }

  try {
    await reloadAppAsync('Layout direction changed');
  } catch (error) {
    logger.error('Could not restart the app after a layout direction change', { error });
  }
}
