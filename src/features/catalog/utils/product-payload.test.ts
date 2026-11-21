import { describe, expect, it } from 'vitest';

import {
  EMPTY_PRODUCT_FORM,
  toProductColumns,
  toProductFormValues,
  type ProductFormValues,
} from './product-payload';

const values: ProductFormValues = {
  name: '  Full cream milk ',
  description: '  ',
  priceText: '1,250.50',
  categoryId: 4,
  imagePath: 'stores/9/product/a.jpg',
  isAvailable: false,
};

describe('toProductColumns', () => {
  it('trims text, blanks the description to null and reads the price', () => {
    expect(toProductColumns(values, 9)).toEqual({
      category_id: 4,
      name: 'Full cream milk',
      description: null,
      price: 1250.5,
      image_url: 'stores/9/product/a.jpg',
      is_available: false,
    });
  });

  it('refuses a price that cannot be read', () => {
    expect(() => toProductColumns({ ...values, priceText: 'cheap' }, 9)).toThrow();
  });

  it("refuses another store's picture", () => {
    expect(() => toProductColumns(values, 10)).toThrow();
  });

  it('accepts a product without a picture or category', () => {
    const columns = toProductColumns(
      { ...values, imagePath: null, categoryId: null, description: 'Fresh' },
      9,
    );
    expect(columns.image_url).toBeNull();
    expect(columns.category_id).toBeNull();
    expect(columns.description).toBe('Fresh');
  });
});

describe('toProductFormValues', () => {
  it('fills the form from a saved product', () => {
    expect(
      toProductFormValues({
        name: 'Eggs',
        description: null,
        price: 350,
        categoryId: null,
        imagePath: null,
        isAvailable: true,
      }),
    ).toEqual({
      name: 'Eggs',
      description: '',
      priceText: '350',
      categoryId: null,
      imagePath: null,
      isAvailable: true,
    });
  });

  it('starts a new product in stock', () => {
    expect(EMPTY_PRODUCT_FORM.isAvailable).toBe(true);
  });
});
