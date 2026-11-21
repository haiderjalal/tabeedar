import 'expo-sqlite/localStorage/install';

import { logger } from '@/lib/logger';

import { isLanguageCode, type LanguageCode } from './config';

const STORAGE_KEY = 'tabeedar.language';

/**
 * Reads the language the user picked last time, if any.
 * Synchronous on purpose: the first render must already be in the right language.
 */
export function readLanguagePreference(): LanguageCode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLanguageCode(stored) ? stored : null;
  } catch (error) {
    logger.warn('Could not read the saved language preference', { error });
    return null;
  }
}

export function saveLanguagePreference(language: LanguageCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch (error) {
    // Losing the preference only means the device language is used next launch.
    logger.warn('Could not save the language preference', { error });
  }
}
