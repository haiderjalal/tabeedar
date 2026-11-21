import { describe, expect, it } from 'vitest';

import { buildDirectionsUrl } from './maps-link';

describe('buildDirectionsUrl', () => {
  it('points Maps at the destination', () => {
    expect(buildDirectionsUrl({ latitude: 33.7, longitude: 73.05 })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=33.7,73.05',
    );
  });

  it('keeps negative coordinates intact', () => {
    expect(buildDirectionsUrl({ latitude: -33.86, longitude: -151.2 })).toContain(
      'destination=-33.86,-151.2',
    );
  });
});
