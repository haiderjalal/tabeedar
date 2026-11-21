import type { Coordinates } from './coordinates';

/**
 * A Google Maps address that opens turn-by-turn directions to a point. It is a plain web address:
 * phones hand it to the Maps app when it is installed, and a browser shows it otherwise, so no
 * extra package or permission is needed.
 */
export function buildDirectionsUrl({ latitude, longitude }: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
