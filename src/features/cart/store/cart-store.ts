// Makes the synchronous `localStorage` available (it is also installed by the Supabase client).
import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { onSignedOut } from '@/lib/session-events';

import {
  EMPTY_CART,
  addProduct,
  changeQuantity,
  isFromOtherStore,
  removeProduct,
  startCartWith,
  type Cart,
  type CartProductRef,
  type CartStoreRef,
} from '../logic/cart.logic';
import { cartSnapshotSchema } from '../schemas/cart-snapshot.schema';

/** Result of `add`: the product went in, or it belongs to another store and needs a decision. */
export type AddResult = 'added' | 'other-store';

interface CartState extends Cart {
  add: (store: CartStoreRef, product: CartProductRef) => AddResult;
  /** Empties the cart and starts a new one with this product (after the customer agreed). */
  startNew: (store: CartStoreRef, product: CartProductRef) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

function pickCart(state: Cart): Cart {
  return { storeId: state.storeId, storeName: state.storeName, lines: state.lines };
}

/**
 * The shopping cart, kept on the device so it survives closing the app. All the rules live in
 * `cart.logic.ts`; this file only holds the state and the saving. Screens use the hooks in
 * `hooks/use-cart.ts` instead of importing this directly.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...EMPTY_CART,
      add: (store, product) => {
        const cart = pickCart(get());
        if (isFromOtherStore(cart, store.id)) return 'other-store';
        set(addProduct(cart, store, product));
        return 'added';
      },
      startNew: (store, product) => set(startCartWith(store, product)),
      setQuantity: (productId, quantity) =>
        set(changeQuantity(pickCart(get()), productId, quantity)),
      remove: (productId) => set(removeProduct(pickCart(get()), productId)),
      clear: () => set(EMPTY_CART),
    }),
    {
      name: 'tabeedar.cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only the cart is saved, not the functions. (Written out so the types infer the full state.)
      partialize: (state: CartState): Cart => pickCart(state),
      // A saved cart that does not pass the checks is ignored, so bad data cannot crash the app.
      merge: (saved, current) => {
        const parsed = cartSnapshotSchema.safeParse(saved);
        return parsed.success ? { ...current, ...parsed.data } : current;
      },
    },
  ),
);

// Someone else may use this phone next, so the cart goes when the person signs out.
onSignedOut(() => useCartStore.getState().clear());
