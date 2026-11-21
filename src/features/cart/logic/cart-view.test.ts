import { describe, expect, it } from 'vitest';

import { buildCartView } from './cart-view';
import type { Cart } from './cart.logic';

const cart: Cart = {
  storeId: 1,
  storeName: 'Ali Traders',
  lines: [
    { productId: 10, name: 'Milk 1L', unitPrice: 280, quantity: 2 },
    { productId: 11, name: 'Eggs', unitPrice: 345.5, quantity: 1 },
  ],
};

describe('buildCartView', () => {
  it('shows the cart as saved when the live check has not worked', () => {
    const view = buildCartView(cart, undefined);
    expect(view.subtotal).toBe(2 * 280 + 345.5);
    expect(view.hasUnavailable).toBe(false);
    expect(view.canCheckout).toBe(true);
    expect(view.lines.every((l) => !l.priceChanged && !l.isUnavailable)).toBe(true);
  });

  it('is clean when nothing changed', () => {
    const view = buildCartView(cart, [
      { id: 10, price: 280, isAvailable: true },
      { id: 11, price: 345.5, isAvailable: true },
    ]);
    expect(view.lines.map((l) => l.priceChanged)).toEqual([false, false]);
    expect(view.canCheckout).toBe(true);
  });

  it('flags a changed price and totals at the new price', () => {
    const view = buildCartView(cart, [
      { id: 10, price: 300, isAvailable: true },
      { id: 11, price: 345.5, isAvailable: true },
    ]);
    expect(view.lines[0]).toMatchObject({ priceChanged: true, currentPrice: 300 });
    expect(view.subtotal).toBe(2 * 300 + 345.5);
    expect(view.canCheckout).toBe(true);
  });

  it('flags an out-of-stock product, leaves it out of the total and blocks checkout', () => {
    const view = buildCartView(cart, [
      { id: 10, price: 280, isAvailable: false },
      { id: 11, price: 345.5, isAvailable: true },
    ]);
    expect(view.lines[0]?.isUnavailable).toBe(true);
    expect(view.subtotal).toBe(345.5);
    expect(view.hasUnavailable).toBe(true);
    expect(view.canCheckout).toBe(false);
  });

  it('treats a product that no longer exists as unavailable', () => {
    const view = buildCartView(cart, [{ id: 11, price: 345.5, isAvailable: true }]);
    expect(view.lines[0]?.isUnavailable).toBe(true);
    expect(view.canCheckout).toBe(false);
  });

  it('cannot check out an empty cart', () => {
    const view = buildCartView({ storeId: null, storeName: null, lines: [] }, []);
    expect(view.canCheckout).toBe(false);
    expect(view.subtotal).toBe(0);
  });
});
