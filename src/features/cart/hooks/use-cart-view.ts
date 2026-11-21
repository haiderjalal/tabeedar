import { useQuery } from '@tanstack/react-query';

import { buildCartView, type CartView } from '../logic/cart-view';
import { getLiveProducts } from '../services/cart.service';

import { useCart } from './use-cart';

const REFRESH_AFTER_MS = 15_000;

interface UseCartViewResult {
  view: CartView;
  /** True while the prices are being checked; the cart is shown as saved until then. */
  isChecking: boolean;
}

/**
 * The cart together with the current price and availability of each product, so the cart and
 * checkout screens can warn before the customer tries to order something that is gone.
 */
export function useCartView(): UseCartViewResult {
  const cart = useCart();
  const productIds = cart.lines.map((line) => line.productId).sort((a, b) => a - b);

  const live = useQuery({
    queryKey: ['cart', 'live-products', productIds],
    queryFn: () => getLiveProducts(productIds),
    enabled: productIds.length > 0,
    staleTime: REFRESH_AFTER_MS,
  });

  return { view: buildCartView(cart, live.data), isChecking: live.isFetching };
}
