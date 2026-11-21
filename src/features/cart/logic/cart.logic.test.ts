import { describe, expect, it } from 'vitest';

import {
  EMPTY_CART,
  MAX_LINE_QUANTITY,
  addProduct,
  cartItemCount,
  cartSubtotal,
  changeQuantity,
  isFromOtherStore,
  quantityOf,
  removeProduct,
  startCartWith,
  type Cart,
} from './cart.logic';

const aliStore = { id: 1, name: 'Ali Traders' };
const bilalStore = { id: 2, name: 'Bilal Mart' };
const milk = { id: 10, name: 'Milk 1L', price: 280 };
const eggs = { id: 11, name: 'Eggs (dozen)', price: 345.5 };
const chips = { id: 20, name: 'Chips', price: 60 };

describe('adding to the cart', () => {
  it('starts a cart for the first product', () => {
    const cart = addProduct(EMPTY_CART, aliStore, milk);
    expect(cart.storeId).toBe(1);
    expect(cart.storeName).toBe('Ali Traders');
    expect(cart.lines).toEqual([{ productId: 10, name: 'Milk 1L', unitPrice: 280, quantity: 1 }]);
  });

  it('adds a second product as its own line', () => {
    const cart = addProduct(addProduct(EMPTY_CART, aliStore, milk), aliStore, eggs);
    expect(cart.lines.map((l) => l.productId)).toEqual([10, 11]);
  });

  it('adding the same product again raises its quantity instead of repeating the line', () => {
    const cart = addProduct(addProduct(EMPTY_CART, aliStore, milk), aliStore, milk);
    expect(cart.lines).toHaveLength(1);
    expect(quantityOf(cart, 10)).toBe(2);
  });

  it('never goes above the maximum quantity', () => {
    let cart: Cart = EMPTY_CART;
    for (let i = 0; i < MAX_LINE_QUANTITY + 5; i += 1) cart = addProduct(cart, aliStore, milk);
    expect(quantityOf(cart, 10)).toBe(MAX_LINE_QUANTITY);
  });

  it('does not mix stores: the cart is returned unchanged', () => {
    const cart = addProduct(EMPTY_CART, aliStore, milk);
    expect(isFromOtherStore(cart, 2)).toBe(true);
    expect(addProduct(cart, bilalStore, chips)).toBe(cart);
  });

  it('an empty cart accepts a product from any store', () => {
    expect(isFromOtherStore(EMPTY_CART, 2)).toBe(false);
  });

  it('startCartWith replaces everything, which is what "start a new cart" does', () => {
    const cart = startCartWith(bilalStore, chips);
    expect(cart.storeId).toBe(2);
    expect(cart.lines).toEqual([{ productId: 20, name: 'Chips', unitPrice: 60, quantity: 1 }]);
  });
});

describe('changing and removing', () => {
  const twoLines = addProduct(addProduct(EMPTY_CART, aliStore, milk), aliStore, eggs);

  it('sets a quantity', () => {
    expect(quantityOf(changeQuantity(twoLines, 10, 5), 10)).toBe(5);
  });

  it('a quantity of zero or less removes the line', () => {
    expect(changeQuantity(twoLines, 10, 0).lines.map((l) => l.productId)).toEqual([11]);
    expect(changeQuantity(twoLines, 10, -3).lines.map((l) => l.productId)).toEqual([11]);
  });

  it('clamps and rounds down a quantity', () => {
    expect(quantityOf(changeQuantity(twoLines, 10, 1000), 10)).toBe(MAX_LINE_QUANTITY);
    expect(quantityOf(changeQuantity(twoLines, 10, 2.9), 10)).toBe(2);
  });

  it('ignores a product that is not in the cart', () => {
    expect(changeQuantity(twoLines, 999, 4).lines).toEqual(twoLines.lines);
  });

  it('removing the last line empties the cart and forgets the store', () => {
    const cart = removeProduct(removeProduct(twoLines, 10), 11);
    expect(cart).toEqual(EMPTY_CART);
    expect(cart.storeId).toBeNull();
  });

  it('does not change the original cart', () => {
    const before = JSON.stringify(twoLines);
    changeQuantity(twoLines, 10, 7);
    removeProduct(twoLines, 11);
    expect(JSON.stringify(twoLines)).toBe(before);
  });
});

describe('totals', () => {
  it('counts units, not lines', () => {
    let cart = addProduct(EMPTY_CART, aliStore, milk);
    cart = changeQuantity(cart, 10, 3);
    cart = addProduct(cart, aliStore, eggs);
    expect(cartItemCount(cart)).toBe(4);
    expect(cartItemCount(EMPTY_CART)).toBe(0);
  });

  it('adds up price x quantity exactly', () => {
    let cart = addProduct(EMPTY_CART, aliStore, milk);
    cart = changeQuantity(cart, 10, 2);
    cart = addProduct(cart, aliStore, eggs);
    expect(cartSubtotal(cart)).toBe(2 * 280 + 345.5);
  });

  it('has no floating point drift', () => {
    const cheap = { id: 30, name: 'Sweet', price: 0.1 };
    let cart = addProduct(EMPTY_CART, aliStore, cheap);
    cart = changeQuantity(cart, 30, 3);
    expect(cartSubtotal(cart)).toBe(0.3);
  });

  it('can price lines with fresher prices than the snapshot', () => {
    const cart = changeQuantity(addProduct(EMPTY_CART, aliStore, milk), 10, 2);
    expect(cartSubtotal(cart, () => 300)).toBe(600);
  });

  it('an empty cart costs nothing', () => {
    expect(cartSubtotal(EMPTY_CART)).toBe(0);
  });
});
