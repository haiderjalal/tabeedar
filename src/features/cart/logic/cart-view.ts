import { cartSubtotal, type Cart, type CartLine } from './cart.logic';

/** The current state of a product in the database, as far as the cart cares. */
export interface LiveProduct {
  id: number;
  price: number;
  isAvailable: boolean;
}

export interface CartLineView extends CartLine {
  /** What the product costs now. The saved `unitPrice` may be out of date. */
  currentPrice: number;
  /** Removed by the store, hidden, or marked out of stock since it was added. */
  isUnavailable: boolean;
  priceChanged: boolean;
}

export interface CartView {
  lines: CartLineView[];
  /** Total of the lines that can still be ordered, at their current prices. */
  subtotal: number;
  hasUnavailable: boolean;
  /** Something to order, and nothing in the way. */
  canCheckout: boolean;
}

/**
 * Compares the cart with the live state of its products, so the screen can warn about price changes
 * and items that are gone. `live` is undefined when the check has not worked (for example offline);
 * the cart is then shown as saved, without warnings. `place_order` checks everything again anyway.
 */
export function buildCartView(cart: Cart, live: readonly LiveProduct[] | undefined): CartView {
  const liveById = live ? new Map(live.map((product) => [product.id, product])) : null;

  const lines = cart.lines.map((line): CartLineView => {
    if (liveById === null) {
      return { ...line, currentPrice: line.unitPrice, isUnavailable: false, priceChanged: false };
    }
    const product = liveById.get(line.productId);
    if (!product || !product.isAvailable) {
      return { ...line, currentPrice: line.unitPrice, isUnavailable: true, priceChanged: false };
    }
    return {
      ...line,
      currentPrice: product.price,
      isUnavailable: false,
      priceChanged: product.price !== line.unitPrice,
    };
  });

  const payable = lines.filter((line) => !line.isUnavailable);
  const priceById = new Map(payable.map((line) => [line.productId, line.currentPrice]));
  const subtotal = cartSubtotal(
    { ...cart, lines: payable },
    (line) => priceById.get(line.productId) ?? line.unitPrice,
  );

  const hasUnavailable = payable.length !== lines.length;
  return { lines, subtotal, hasUnavailable, canCheckout: lines.length > 0 && !hasUnavailable };
}
