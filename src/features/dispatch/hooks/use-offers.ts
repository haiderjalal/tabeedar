import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { orderKeys } from '@/features/orders/query-keys';

import { RIDER_REFRESH_MS } from '../constants';
import { dispatchKeys } from '../query-keys';
import { acceptDelivery, listOffers } from '../services/dispatch.service';
import type { DeliveryOffer } from '../types';

/**
 * Deliveries the rider can accept, refreshed every few seconds so a new one appears (and one taken
 * by another rider disappears) without pulling to refresh. Only runs while the rider is online.
 */
export function useOffers(isOnline: boolean): UseQueryResult<DeliveryOffer[], Error> {
  return useQuery({
    queryKey: dispatchKeys.offers,
    queryFn: listOffers,
    enabled: isOnline,
    refetchInterval: RIDER_REFRESH_MS,
  });
}

/** Accepts a delivery. Refreshes every order list afterwards, whether or not it worked. */
export function useAcceptDelivery(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptDelivery,
    // Refresh even on failure: the usual reason is that another rider just took it, and the offer
    // should vanish. Not awaited, so nothing waits for the refresh.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
