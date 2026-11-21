/**
 * Static i18n configuration: which languages exist and how they behave.
 * Adding a language means adding an entry here plus a folder under `locales/`.
 */

export const LANGUAGES = {
  en: { code: 'en', label: 'English', isRTL: false },
  // Language names are shown in their own script so people can find theirs at a glance.
  ur: { code: 'ur', label: 'اردو', isRTL: true },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const SUPPORTED_LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

/** Every string lives in the `common` namespace until a feature needs its own. */
export const DEFAULT_NAMESPACE = 'common';

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && value in LANGUAGES;
}
