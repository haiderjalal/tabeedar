import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, DEFAULT_NAMESPACE, isLanguageCode, type LanguageCode } from './config';
import { applyLanguageDirection, restartToApplyDirection } from './direction';
import { readLanguagePreference, saveLanguagePreference } from './language-storage';
import { resources } from './locales';

/** Saved choice first, then the phone's language, then English. */
function resolveInitialLanguage(): LanguageCode {
  const saved = readLanguagePreference();
  if (saved) return saved;

  const deviceLanguage = getLocales()[0]?.languageCode;
  return isLanguageCode(deviceLanguage) ? deviceLanguage : DEFAULT_LANGUAGE;
}

const initialLanguage = resolveInitialLanguage();

// A dedicated instance (not the shared default export) keeps the app's i18n state self-contained.
// `initReactI18next` registers it, so `useTranslation` finds it without a provider.
const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: DEFAULT_NAMESPACE,
  // React already escapes rendered text, so i18next must not escape it a second time.
  interpolation: { escapeValue: false },
  // Translations are bundled, so initialise synchronously and avoid a loading flash.
  initAsync: false,
});

// Make sure the native direction matches the language before the first screen renders.
// This does not restart the app; a mismatch is fixed on the next launch.
applyLanguageDirection(initialLanguage);

/**
 * Switches the app language and remembers the choice.
 * Restarts the app when the layout direction flips (English <-> Urdu).
 */
export async function setAppLanguage(language: LanguageCode): Promise<void> {
  if (language === i18n.language) return;

  saveLanguagePreference(language);
  await i18n.changeLanguage(language);

  if (applyLanguageDirection(language)) {
    await restartToApplyDirection();
  }
}

export { i18n };
