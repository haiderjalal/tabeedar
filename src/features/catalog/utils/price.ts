import { MAX_PRICE } from '../constants';

/** Urdu keyboards type Eastern Arabic digits (۰-۹), Arabic keyboards a similar set (٠-٩). */
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0;
const ARABIC_INDIC_ZERO = 0x0660;

/** Digits are zero to nine; everything else a price may contain is separators handled below. */
function toAsciiDigits(text: string): string {
  return text.replace(/[۰-۹٠-٩]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const zero =
      code >= EXTENDED_ARABIC_INDIC_ZERO ? EXTENDED_ARABIC_INDIC_ZERO : ARABIC_INDIC_ZERO;
    return String(code - zero);
  });
}

/**
 * Reads a price typed by a person, in rupees. Accepts digits with an optional decimal part of up to
 * two places ("1250", "1,250.50"), spaces and thousands commas, and Urdu or Arabic digits and
 * separators. Returns null for anything else (letters, a negative sign, three decimals, too large).
 * Zero is accepted because the database accepts it.
 */
export function parsePrice(text: string): number | null {
  const cleaned = toAsciiDigits(text)
    // Arabic decimal separator and thousands separator.
    .replace(/٫/g, '.')
    .replace(/[\s,٬]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const price = Number(cleaned);
  return price <= MAX_PRICE ? price : null;
}

/** A stored price as it appears in the form field: whole rupees without decimals, else two places. */
export function formatPriceInput(price: number): string {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}
