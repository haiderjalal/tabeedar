import type { LanguageCode } from '@/lib/i18n/config';

/** "Rs 1,250" or "Rs 345.5". Digits stay Latin in both languages until the owner decides otherwise. */
export function formatRupees(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return `Rs ${rounded.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export interface FormattedDistance {
  value: string;
  /** The caller translates the unit ("m" / "km"), because Urdu spells it out. */
  unit: 'm' | 'km';
}

/** Metres under a kilometre, otherwise kilometres with one decimal (none from 10 km up). */
export function formatDistance(meters: number): FormattedDistance {
  if (meters < 1000) return { value: String(Math.round(meters)), unit: 'm' };
  const kilometres = meters / 1000;
  return { value: kilometres.toFixed(kilometres < 10 ? 1 : 0), unit: 'km' };
}

/** BCP 47 locales with Latin digits (`-u-nu-latn`), matching the digits decision for Urdu. */
const DATE_LOCALES: Record<LanguageCode, string> = {
  en: 'en-GB-u-nu-latn',
  ur: 'ur-PK-u-nu-latn',
};

/**
 * A short date and time such as "20 Nov 2026, 14:05". Falls back to the device default if this
 * phone's JavaScript engine does not know the locale, so a date can never crash a screen.
 */
export function formatDateTime(iso: string, language: LanguageCode): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(DATE_LOCALES[language], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}
