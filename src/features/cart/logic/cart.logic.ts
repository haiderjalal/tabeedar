/**
 * Cart rules as plain functions, so they can be tested without a screen or a store.
 *
 * The cart is only for showing the customer what they are about to order. Prices here are a
 * snapshot taken when the item was added; `place_order` in the database prices every line again,
 * so nothing here can change what the customer is charged.
 */

/**
 * Highest quantity of one product in the cart. This is a convenience limit for the stepper, not a
 * business rule (the database has its own technical cap of 1000).
 */
export const MAX_LINE_QUANTITY = 99;

export interface CartLine {
  productId: number;
  name: string;
  /** Price per unit when the item was added, in rupees. */
  unitPrice: number;
  quantity: number;
}

export interface Cart {
  storeId: number | null;
  storeName: string | null;
  lines: CartLine[];
}

export interface CartStoreRef {
  id: number;
  name: string;
}

export interface CartProductRef {
  id: number;
  name: string;
  price: number;
}

export const EMPTY_CART: Cart = { storeId: null, storeName: null, lines: [] };

/** True when adding from this store would mix two stores in one cart (not allowed). */
export function isFromOtherStore(cart: Cart, storeId: number): boolean {
  return cart.lines.length > 0 && cart.storeId !== storeId;
}

/** A cart containing just one unit of the product. Used to start over or to begin a cart. */
export function startCartWith(store: CartStoreRef, product: CartProductRef): Cart {
  return {
    storeId: store.id,
    storeName: store.name,
    lines: [{ productId: product.id, name: product.name, unitPrice: product.price, quantity: 1 }],
  };
}

/**
 * Adds one unit of a product. If the cart belongs to another store it is returned unchanged:
 * the screen must ask the customer first and then call `startCartWith`.
 */
export function addProduct(cart: Cart, store: CartStoreRef, product: CartProductRef): Cart {
  if (isFromOtherStore(cart, store.id)) return cart;
  if (cart.lines.length === 0) return startCartWith(store, product);

  const existing = cart.lines.find((line) => line.productId === product.id);
  if (!existing) {
    return {
      ...cart,
      lines: [
        ...cart.lines,
        { productId: product.id, name: product.name, unitPrice: product.price, quantity: 1 },
      ],
    };
  }
  return changeQuantity(cart, product.id, existing.quantity + 1);
}

/** Sets a line's quantity: zero or less removes it, and the maximum is enforced. */
export function changeQuantity(cart: Cart, productId: number, quantity: number): Cart {
  if (quantity <= 0) return removeProduct(cart, productId);

  const clamped = Math.min(Math.floor(quantity), MAX_LINE_QUANTITY);
  return {
    ...cart,
    lines: cart.lines.map((line) =>
      line.productId === productId ? { ...line, quantity: clamped } : line,
    ),
  };
}

/** Removes a line. An emptied cart forgets its store, so the next item can come from anywhere. */
export function removeProduct(cart: Cart, productId: number): Cart {
  const lines = cart.lines.filter((line) => line.productId !== productId);
  return lines.length === 0 ? EMPTY_CART : { ...cart, lines };
}

export function quantityOf(cart: Cart, productId: number): number {
  return cart.lines.find((line) => line.productId === productId)?.quantity ?? 0;
}

/** Total number of units, for the badge on the cart tab. */
export function cartItemCount(cart: Cart): number {
  return cart.lines.reduce((total, line) => total + line.quantity, 0);
}

/**
 * Sum of price x quantity, in rupees. Works in paisa (whole numbers) per line and only then
 * converts back, so 0.1 + 0.2 style errors cannot appear in the total.
 *
 * `priceOf` lets a screen price lines with fresher prices than the stored snapshot.
 */
export function cartSubtotal(
  cart: Cart,
  priceOf: (line: CartLine) => number = unitPriceOf,
): number {
  const paisa = cart.lines.reduce(
    (total, line) => total + Math.round(priceOf(line) * 100) * line.quantity,
    0,
  );
  return paisa / 100;
}

function unitPriceOf(line: CartLine): number {
  return line.unitPrice;
}
