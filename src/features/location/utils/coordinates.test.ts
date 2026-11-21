import { describe, expect, it } from 'vitest';

import { isValidCoordinates, parseCoordinates } from './coordinates';

const islamabad = { latitude: 33.708, longitude: 73.042 };

describe('parseCoordinates', () => {
  it.each([
    ['plain with comma', '33.7080, 73.0420'],
    ['plain with space', '33.7080 73.0420'],
    ['plain, no spaces', '33.7080,73.0420'],
    ['surrounding spaces', '   33.7080, 73.0420  '],
    ['a WhatsApp location link', 'https://maps.google.com/?q=33.7080,73.0420'],
    ['a link with extra parameters', 'https://maps.google.com/?q=33.7080,73.0420&z=17&hl=en'],
    ['an encoded comma', 'https://maps.google.com/?q=33.7080%2C73.0420'],
    ['a map view link', 'https://www.google.com/maps/@33.7080,73.0420,17z'],
    ['an ll= link', 'https://maps.google.com/maps?ll=33.7080,73.0420&z=15'],
    ['a geo: link', 'geo:33.7080,73.0420?q=33.7080,73.0420'],
  ])('reads %s', (_name, text) => {
    expect(parseCoordinates(text)).toEqual(islamabad);
  });

  it('prefers the place itself over the map view centre in a long link', () => {
    const link =
      'https://www.google.com/maps/place/Shop/@33.9999,73.9999,15z/data=!3m1!4b1!4m6!3m5!1s0x1:0x2!8m2!3d33.7080!4d73.0420';
    expect(parseCoordinates(link)).toEqual(islamabad);
  });

  it('reads negative coordinates (southern and western hemispheres)', () => {
    expect(parseCoordinates('-33.8688, 151.2093')).toEqual({
      latitude: -33.8688,
      longitude: 151.2093,
    });
    expect(parseCoordinates('40.7128, -74.0060')).toEqual({
      latitude: 40.7128,
      longitude: -74.006,
    });
  });

  it('takes latitude first, like Google Maps', () => {
    expect(parseCoordinates('10, 20')).toEqual({ latitude: 10, longitude: 20 });
  });

  it.each([
    ['empty text', ''],
    ['only spaces', '   '],
    ['words', 'near the red gate'],
    ['one number', '33.7080'],
    ['three numbers', '33.7080, 73.0420, 12'],
    ['latitude out of range', '95.0, 73.0'],
    ['longitude out of range', '33.0, 200.0'],
    ['a shortened link, which hides the position', 'https://maps.app.goo.gl/abc123XYZ'],
    ['a link with no position', 'https://www.google.com/maps'],
  ])('rejects %s', (_name, text) => {
    expect(parseCoordinates(text)).toBeNull();
  });
});

describe('isValidCoordinates', () => {
  it('accepts the edges of the valid range', () => {
    expect(isValidCoordinates({ latitude: 90, longitude: 180 })).toBe(true);
    expect(isValidCoordinates({ latitude: -90, longitude: -180 })).toBe(true);
  });

  it('rejects out-of-range and non-numbers', () => {
    expect(isValidCoordinates({ latitude: 90.1, longitude: 0 })).toBe(false);
    expect(isValidCoordinates({ latitude: 0, longitude: -180.1 })).toBe(false);
    expect(isValidCoordinates({ latitude: Number.NaN, longitude: 0 })).toBe(false);
    expect(isValidCoordinates({ latitude: 0, longitude: Number.POSITIVE_INFINITY })).toBe(false);
  });
});
