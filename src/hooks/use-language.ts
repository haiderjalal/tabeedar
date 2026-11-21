import { useTranslation } from 'react-i18next';

import { setAppLanguage } from '@/lib/i18n';
import { DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode } from '@/lib/i18n/config';

interface UseLanguageResult {
  /** The language currently shown. Components re-render when it changes. */
  language: LanguageCode;
  /** Switches language, remembers it, and restarts the app if the layout direction flips. */
  changeLanguage: (language: LanguageCode) => Promise<void>;
}

export function useLanguage(): UseLanguageResult {
  const { i18n } = useTranslation();
  const language = isLanguageCode(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;

  return { language, changeLanguage: setAppLanguage };
}
