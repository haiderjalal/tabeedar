/** Everything people type between digits: spaces, dashes, dots and brackets. */
const SEPARATORS = /[\s\-().]/g;

/**
 * Same rule as the `phone_number` domain in the database (a leading `+`, then 7 to 15 digits).
 * We always add the `+`, so the optional `+` the database allows is not needed here.
 */
const PHONE_PATTERN = /^\+[0-9]{7,15}$/;

const PAKISTAN_COUNTRY_CODE = '92';

/** Shortest valid Pakistani number written with the country code: 92 plus a 9-digit number. */
const MIN_PAKISTAN_DIGITS_WITH_CODE = 11;

/**
 * Turns what a person typed into the stored format, e.g. `0300 1234567` -> `+923001234567`.
 *
 * Tabeedar serves Pakistan, so a number starting with a single `0` is read as a local number.
 * International numbers are accepted when typed with `+` or `00`. Anything that cannot be
 * understood is returned cleaned but unchanged, and `isValidPhone` then rejects it.
 */
export function normalizePhone(input: string): string {
  const cleaned = input.trim().replace(SEPARATORS, '');

  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith('0')) return `+${PAKISTAN_COUNTRY_CODE}${cleaned.slice(1)}`;
  if (
    cleaned.startsWith(PAKISTAN_COUNTRY_CODE) &&
    cleaned.length >= MIN_PAKISTAN_DIGITS_WITH_CODE
  ) {
    return `+${cleaned}`;
  }
  return cleaned;
}

/** True when a normalized number is something the database will accept. */
export function isValidPhone(normalized: string): boolean {
  return PHONE_PATTERN.test(normalized);
}
