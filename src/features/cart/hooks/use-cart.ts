import { useShallow } from 'zustand/react/shallow';

import { cartItemCount, quantityOf, type Cart } from '../logic/cart.logic';
import { useCartStore } from '../store/cart-store';

/** The saved cart: which store it is for and its lines. */
export function useCart(): Cart {
  return useCartStore(
    useShallow((state) => ({
      storeId: state.storeId,
      storeName: state.storeName,
      lines: state.lines,
    })),
  );
}

/** The things a screen can do to the cart. */
export function useCartActions() {
  return useCartStore(
    useShallow((state) => ({
      add: state.add,
      startNew: state.startNew,
      setQuantity: state.setQuantity,
      remove: state.remove,
      clear: state.clear,
    })),
  );
}

/** Number of units in the cart, for the badge on the cart tab. */
export function useCartCount(): number {
  return useCartStore((state) => cartItemCount(state));
}

/** How many of one product are in the cart (0 if none). */
export function useProductQuantity(productId: number): number {
  return useCartStore((state) => quantityOf(state, productId));
}
