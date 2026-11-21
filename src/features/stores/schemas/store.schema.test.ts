import { describe, expect, it } from 'vitest';

import {
  parseCatalog,
  parseProducts,
  parseStoreDetails,
  parseStoreSummaries,
} from './store.schema';

const summaryRow = {
  id: 1,
  name: 'Al-Fatah Fresh Mart',
  description: null,
  area: 'F-7',
  city: 'Islamabad',
  logo_url: null,
  is_open: true,
  distance_m: 2012,
  matching_products: ['Fresh Milk 1L'],
};

const productRow = {
  id: 5,
  store_id: 1,
  category_id: null,
  name: 'Bread',
  description: null,
  price: 150,
  image_url: null,
  is_available: true,
  sort_order: 1,
};

describe('parseStoreSummaries', () => {
  it('converts rows to the app shape', () => {
    expect(parseStoreSummaries([summaryRow])).toEqual([
      {
        id: 1,
        name: 'Al-Fatah Fresh Mart',
        description: null,
        area: 'F-7',
        city: 'Islamabad',
        logoPath: null,
        isOpen: true,
        distanceM: 2012,
        matchingProducts: ['Fresh Milk 1L'],
      },
    ]);
  });

  it('turns "no matching products" (null) into an empty list', () => {
    expect(
      parseStoreSummaries([{ ...summaryRow, matching_products: null }])[0]?.matchingProducts,
    ).toEqual([]);
  });

  it('accepts an empty result', () => {
    expect(parseStoreSummaries([])).toEqual([]);
  });

  it('rejects rows that are not stores', () => {
    expect(() => parseStoreSummaries([{ ...summaryRow, id: 'one' }])).toThrow();
    expect(() => parseStoreSummaries([{ ...summaryRow, is_open: 'yes' }])).toThrow();
    expect(() => parseStoreSummaries({ not: 'an array' })).toThrow();
    expect(() => parseStoreSummaries(null)).toThrow();
  });
});

describe('parseStoreDetails', () => {
  it('converts a store row', () => {
    const details = parseStoreDetails({
      id: 1,
      name: 'Ali Traders',
      description: 'Groceries',
      phone: '+923001000001',
      address_line: 'Shop 12',
      area: null,
      city: 'Islamabad',
      logo_url: null,
      cover_url: null,
      is_open: false,
    });
    expect(details.addressLine).toBe('Shop 12');
    expect(details.isOpen).toBe(false);
  });

  it('rejects an incomplete row', () => {
    expect(() => parseStoreDetails({ id: 1, name: 'x' })).toThrow();
  });
});

describe('parseProducts and parseCatalog', () => {
  it('converts products, keeping price as a number', () => {
    const [product] = parseProducts([productRow]);
    expect(product).toMatchObject({ id: 5, storeId: 1, price: 150, isAvailable: true });
  });

  it('rejects a negative price or a non-numeric price', () => {
    expect(() => parseProducts([{ ...productRow, price: -1 }])).toThrow();
    expect(() => parseProducts([{ ...productRow, price: '150' }])).toThrow();
  });

  it('builds a catalog from categories and products', () => {
    const catalog = parseCatalog([{ id: 3, name: 'Dairy', sort_order: 1 }], [productRow]);
    expect(catalog.categories).toEqual([{ id: 3, name: 'Dairy', sortOrder: 1 }]);
    expect(catalog.products).toHaveLength(1);
  });
});
