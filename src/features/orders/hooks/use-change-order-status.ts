import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { orderKeys } from '../query-keys';
import { changeOrderStatus } from '../services/orders.service';
import type { OrderStatus } from '../utils/order-status';

interface ChangeOrderStatusInput {
  orderId: number;
  status: OrderStatus;
  /** An optional reason, shown to the customer in the order's history. */
  note: string | null;
}

/** Moves an order to its next status, then refreshes every order screen in the background. */
export function useChangeOrderStatus(): UseMutationResult<void, Error, ChangeOrderStatusInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status, note }: ChangeOrderStatusInput) =>
      changeOrderStatus(orderId, status, note),
    // Refresh even on failure: the usual reason is that the order just changed (the customer
    // cancelled), and the screen should show how it is now. Not awaited, so nothing waits for it.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
