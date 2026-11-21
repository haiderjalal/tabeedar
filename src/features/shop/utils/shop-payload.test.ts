import { describe, expect, it } from 'vitest';

import { toShopPayload, type ShopFormValues } from './shop-payload';

const baseValues: ShopFormValues = {
  name: '  Ali Traders ',
  description: '  ',
  phone: '0300 1234567',
  addressLine: ' Shop 4, Market Road ',
  area: '',
  city: ' Islamabad ',
  latitude: 33.6844,
  longitude: 73.0479,
  logoPath: null,
  coverPath: null,
};

describe('toShopPayload', () => {
  it('trims text, blanks optional fields to null and normalizes the phone', () => {
    expect(toShopPayload(baseValues, null)).toEqual({
      name: 'Ali Traders',
      description: null,
      phone: '+923001234567',
      address_line: 'Shop 4, Market Road',
      area: null,
      city: 'Islamabad',
      latitude: 33.6844,
      longitude: 73.0479,
      logo_url: null,
      cover_url: null,
    });
  });

  it('keeps a blank phone as null', () => {
    expect(toShopPayload({ ...baseValues, phone: '' }, null).phone).toBeNull();
  });

  it('passes the store its own pictures through', () => {
    const payload = toShopPayload(
      { ...baseValues, logoPath: 'stores/7/logo/a.jpg', coverPath: 'stores/7/cover/b.jpg' },
      7,
    );
    expect(payload.logo_url).toBe('stores/7/logo/a.jpg');
    expect(payload.cover_url).toBe('stores/7/cover/b.jpg');
  });

  it("refuses another store's picture", () => {
    expect(() => toShopPayload({ ...baseValues, logoPath: 'stores/8/logo/a.jpg' }, 7)).toThrow();
  });

  it('refuses any picture for a store that does not exist yet', () => {
    expect(() =>
      toShopPayload({ ...baseValues, coverPath: 'stores/7/cover/a.jpg' }, null),
    ).toThrow();
  });

  it('refuses a missing map position', () => {
    expect(() => toShopPayload({ ...baseValues, latitude: null }, null)).toThrow();
    expect(() => toShopPayload({ ...baseValues, longitude: null }, null)).toThrow();
  });
});
