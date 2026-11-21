import { useSelectedAddressStore } from '../store/selected-address-store';
import type { Address } from '../types';

import { useAddresses } from './use-addresses';

interface UseSelectedAddressResult {
  /** The address to deliver to, or null when the customer has none saved yet. */
  address: Address | null;
  addresses: Address[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * The delivery address for browsing and checkout: the one the customer picked if it still exists,
 * otherwise their default, otherwise the newest. Null only when they have no addresses.
 */
export function useSelectedAddress(): UseSelectedAddressResult {
  const query = useAddresses();
  const selectedId = useSelectedAddressStore((state) => state.selectedAddressId);

  const addresses = query.data ?? [];
  const address =
    addresses.find((candidate) => candidate.id === selectedId) ??
    addresses.find((candidate) => candidate.isDefault) ??
    addresses[0] ??
    null;

  return {
    address,
    addresses,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
