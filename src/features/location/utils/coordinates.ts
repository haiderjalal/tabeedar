export interface Coordinates {
  latitude: number;
  longitude: number;
}

const NUMBER = String.raw`-?\d{1,3}(?:\.\d+)?`;

/** Google Maps writes the place itself as `!3d<lat>!4d<lng>`. This is the most exact form. */
const PLACE_PATTERN = new RegExp(String.raw`!3d(${NUMBER})!4d(${NUMBER})`);
/** `?q=lat,lng`, `ll=`, `query=`, `center=`: what WhatsApp and the share button produce. */
const QUERY_PATTERN = new RegExp(
  String.raw`[?&](?:q|ll|query|center)=(${NUMBER})(?:,|%2C)\+?(${NUMBER})`,
  'i',
);
/** `/@lat,lng,zoom`: the centre of the map view in a Google Maps address bar link. */
const VIEW_PATTERN = new RegExp(String.raw`@(${NUMBER}),(${NUMBER})`);
/** `geo:lat,lng` links. */
const GEO_PATTERN = new RegExp(String.raw`^geo:(${NUMBER}),(${NUMBER})`, 'i');
/** Just two numbers: "33.7080, 73.0420". */
const PLAIN_PATTERN = new RegExp(String.raw`^(${NUMBER})\s*[,;\s]\s*(${NUMBER})$`);

export function isValidCoordinates({ latitude, longitude }: Coordinates): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Reads a position from text a person pasted: a Google Maps link (including the links WhatsApp
 * makes when you share a location) or plain coordinates. Latitude always comes first, as in Google
 * Maps. Returns null if nothing usable is found, including for shortened links such as
 * maps.app.goo.gl, which hide the position behind a redirect.
 */
export function parseCoordinates(input: string): Coordinates | null {
  const text = input.trim();
  if (text === '') return null;

  const match =
    PLACE_PATTERN.exec(text) ??
    QUERY_PATTERN.exec(text) ??
    VIEW_PATTERN.exec(text) ??
    GEO_PATTERN.exec(text) ??
    PLAIN_PATTERN.exec(text);
  if (!match) return null;

  const coordinates = { latitude: Number(match[1]), longitude: Number(match[2]) };
  return isValidCoordinates(coordinates) ? coordinates : null;
}
