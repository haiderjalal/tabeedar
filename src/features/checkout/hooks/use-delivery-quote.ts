import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { quoteDeliveryFee, type DeliveryQuote } from '../services/checkout.service';

/** The delivery fee for a store and a position. Waits until both are known. */
export function useDeliveryQuote(
  storeId: number | null,
  position: { latitude: number; longitude: number } | null,
): UseQueryResult<DeliveryQuote | null, Error> {
  return useQuery({
    queryKey: [
      'checkout',
      'quote',
      storeId,
      position?.latitude.toFixed(5),
      position?.longitude.toFixed(5),
    ],
    queryFn: () =>
      storeId === null || position === null
        ? Promise.resolve(null)
        : quoteDeliveryFee(storeId, position.latitude, position.longitude),
    enabled: storeId !== null && position !== null,
  });
}
