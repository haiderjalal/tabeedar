/**
 * Reads an id from a route address such as `/stores/12`. Addresses can be typed, shared or
 * tampered with, so anything that is not a plain positive whole number gives null and the screen
 * shows "not found" instead of querying with garbage.
 */
export function parseIdParam(value: string | string[] | undefined): number | null {
  const text = Array.isArray(value) ? value[0] : value;
  if (text === undefined || !/^[1-9]\d{0,14}$/.test(text)) return null;
  return Number(text);
}
