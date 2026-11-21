import { describe, expect, it } from 'vitest';

import { cartSnapshotSchema } from './cart-snapshot.schema';

const line = { productId: 10, name: 'Milk 1L', unitPrice: 280, quantity: 2 };

describe('cartSnapshotSchema', () => {
  it('accepts an empty cart and a normal cart', () => {
    expect(
      cartSnapshotSchema.safeParse({ storeId: null, storeName: null, lines: [] }).success,
    ).toBe(true);
    expect(
      cartSnapshotSchema.safeParse({ storeId: 1, storeName: 'Ali Traders', lines: [line] }).success,
    ).toBe(true);
  });

  it.each([
    ['a missing field', { storeId: 1, lines: [line] }],
    ['a string id', { storeId: '1', storeName: 'x', lines: [line] }],
    ['a zero quantity', { storeId: 1, storeName: 'x', lines: [{ ...line, quantity: 0 }] }],
    [
      'a quantity over the maximum',
      { storeId: 1, storeName: 'x', lines: [{ ...line, quantity: 100 }] },
    ],
    ['a fractional quantity', { storeId: 1, storeName: 'x', lines: [{ ...line, quantity: 1.5 }] }],
    ['a negative price', { storeId: 1, storeName: 'x', lines: [{ ...line, unitPrice: -1 }] }],
    ['items without a store', { storeId: null, storeName: null, lines: [line] }],
    ['the same product twice', { storeId: 1, storeName: 'x', lines: [line, line] }],
    ['null', null],
    ['text', 'not a cart'],
  ])('rejects %s', (_name, value) => {
    expect(cartSnapshotSchema.safeParse(value).success).toBe(false);
  });
});
