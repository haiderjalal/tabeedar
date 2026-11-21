import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { orderKeys } from '../query-keys';
import { cancelOrder } from '../services/orders.service';

/** Cancels an order, then refreshes every order screen in the background. */
export function useCancelOrder(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelOrder,
    // Refresh even on failure (the usual reason is that the store just responded). Not awaited, so
    // the confirmation closes as soon as the answer is in instead of waiting for the refresh.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
