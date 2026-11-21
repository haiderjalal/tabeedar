import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { placeOrder, type PlaceOrderInput } from '../services/checkout.service';

/**
 * Places the order and refreshes the order lists. It deliberately does NOT empty the cart: the
 * checkout screen does that at the moment it leaves for the order page. Emptying it here would
 * show the checkout screen an empty cart for an instant before it knows the order succeeded, and it
 * would send the customer back to the cart. On failure the cart is untouched, so the customer can
 * fix the problem and try again.
 */
export function usePlaceOrder(): UseMutationResult<number, Error, PlaceOrderInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      // Not awaited: the customer should reach their order without waiting for the lists to refresh.
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
