import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { addressKeys } from '../query-keys';
import { deleteAddress, listAddresses, saveAddress } from '../services/addresses.service';
import { useSelectedAddressStore } from '../store/selected-address-store';
import type { Address } from '../types';
import type { AddressFormValues } from '../utils/address-payload';

/** All of the customer's saved addresses, default first. */
export function useAddresses(): UseQueryResult<Address[], Error> {
  return useQuery({ queryKey: addressKeys.all, queryFn: listAddresses });
}

interface SaveAddressInput {
  values: AddressFormValues;
  /** Omit to create a new address. */
  addressId?: number;
}

/** Creates or updates an address, then refreshes the list. */
export function useSaveAddress(): UseMutationResult<Address, Error, SaveAddressInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ values, addressId }: SaveAddressInput) => saveAddress(values, addressId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

/**
 * Deletes an address and, if it was the chosen one, forgets the choice. The address leaves the list
 * straight away; the list is then re-read in the background to confirm.
 */
export function useDeleteAddress(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  const clearIf = useSelectedAddressStore((state) => state.clearIf);
  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: (_result, addressId) => {
      clearIf(addressId);
      queryClient.setQueryData<Address[]>(addressKeys.all, (current) =>
        current?.filter((address) => address.id !== addressId),
      );
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}
