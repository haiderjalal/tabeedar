import { describe, expect, it } from 'vitest';

import type { Catalog, Product } from '../types';

import { groupCatalog } from './group-catalog';

function product(id: number, name: string, categoryId: number | null, sortOrder = 0): Product {
  return {
    id,
    storeId: 1,
    categoryId,
    name,
    description: null,
    price: 100,
    imagePath: null,
    isAvailable: true,
    sortOrder,
  };
}

describe('groupCatalog', () => {
  it('groups products under their categories in the store’s chosen order', () => {
    const catalog: Catalog = {
      categories: [
        { id: 2, name: 'Pantry', sortOrder: 2 },
        { id: 1, name: 'Dairy', sortOrder: 1 },
      ],
      products: [product(10, 'Rice', 2), product(11, 'Milk', 1), product(12, 'Eggs', 1)],
    };

    const sections = groupCatalog(catalog);
    expect(sections.map((s) => s.title)).toEqual(['Dairy', 'Pantry']);
    expect(sections[0]?.data.map((p) => p.name)).toEqual(['Eggs', 'Milk']);
  });

  it('orders products by their position first, then by name', () => {
    const catalog: Catalog = {
      categories: [{ id: 1, name: 'Dairy', sortOrder: 1 }],
      products: [product(1, 'Butter', 1, 2), product(2, 'Yogurt', 1, 1), product(3, 'Milk', 1, 1)],
    };
    expect(groupCatalog(catalog)[0]?.data.map((p) => p.name)).toEqual(['Milk', 'Yogurt', 'Butter']);
  });

  it('puts uncategorised products last, under a heading with no title', () => {
    const catalog: Catalog = {
      categories: [{ id: 1, name: 'Dairy', sortOrder: 1 }],
      products: [product(1, 'Bread', null), product(2, 'Milk', 1)],
    };
    const sections = groupCatalog(catalog);
    expect(sections.map((s) => s.key)).toEqual(['1', 'other']);
    expect(sections[1]?.title).toBeNull();
  });

  it('leaves out categories with no products', () => {
    const catalog: Catalog = {
      categories: [
        { id: 1, name: 'Dairy', sortOrder: 1 },
        { id: 2, name: 'Empty', sortOrder: 2 },
      ],
      products: [product(1, 'Milk', 1)],
    };
    expect(groupCatalog(catalog).map((s) => s.title)).toEqual(['Dairy']);
  });

  it('keeps a product whose category is unknown rather than losing it', () => {
    const catalog: Catalog = { categories: [], products: [product(1, 'Mystery', 99)] };
    expect(groupCatalog(catalog)).toEqual([
      { key: 'other', title: null, data: [expect.objectContaining({ id: 1 })] },
    ]);
  });

  it('returns nothing for a store with no products', () => {
    expect(
      groupCatalog({ categories: [{ id: 1, name: 'Dairy', sortOrder: 1 }], products: [] }),
    ).toEqual([]);
  });
});
