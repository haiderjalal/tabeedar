import { describe, expect, it } from 'vitest';

import type { Catalog, Category, Product } from '@/features/stores/types';

import {
  removeCategory,
  removeProduct,
  setProductAvailable,
  upsertCategory,
  upsertProduct,
} from './catalog-cache';

function product(id: number, categoryId: number | null = null): Product {
  return {
    id,
    storeId: 1,
    categoryId,
    name: `Product ${id}`,
    description: null,
    price: 100,
    imagePath: null,
    isAvailable: true,
    sortOrder: 0,
  };
}

const dairy: Category = { id: 10, name: 'Dairy', sortOrder: 0 };
const snacks: Category = { id: 11, name: 'Snacks', sortOrder: 0 };

const catalog: Catalog = {
  categories: [dairy, snacks],
  products: [product(1, 10), product(2, 11), product(3, null)],
};

describe('upsertCategory', () => {
  it('adds a new category', () => {
    const result = upsertCategory(catalog, { id: 12, name: 'Drinks', sortOrder: 0 });
    expect(result.categories.map((c) => c.name)).toEqual(['Dairy', 'Snacks', 'Drinks']);
  });

  it('replaces an existing category', () => {
    const result = upsertCategory(catalog, { ...dairy, name: 'Milk and eggs' });
    expect(result.categories.map((c) => c.name)).toEqual(['Milk and eggs', 'Snacks']);
  });

  it('does not change the catalog it was given', () => {
    upsertCategory(catalog, { id: 12, name: 'Drinks', sortOrder: 0 });
    expect(catalog.categories).toHaveLength(2);
  });
});

describe('removeCategory', () => {
  it('keeps the products of the category, without a category', () => {
    const result = removeCategory(catalog, 10);
    expect(result.categories.map((c) => c.id)).toEqual([11]);
    expect(result.products.find((p) => p.id === 1)?.categoryId).toBeNull();
    expect(result.products).toHaveLength(3);
  });

  it('leaves the products of other categories alone', () => {
    expect(removeCategory(catalog, 10).products.find((p) => p.id === 2)?.categoryId).toBe(11);
  });
});

describe('products', () => {
  it('adds, replaces and removes a product', () => {
    expect(upsertProduct(catalog, product(4)).products).toHaveLength(4);
    const renamed = upsertProduct(catalog, { ...product(1, 10), name: 'Fresh milk' });
    expect(renamed.products.find((p) => p.id === 1)?.name).toBe('Fresh milk');
    expect(renamed.products).toHaveLength(3);
    expect(removeProduct(catalog, 2).products.map((p) => p.id)).toEqual([1, 3]);
  });

  it('changes only the availability of the chosen product', () => {
    const result = setProductAvailable(catalog, 2, false);
    expect(result.products.map((p) => p.isAvailable)).toEqual([true, false, true]);
  });
});
