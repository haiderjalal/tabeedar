import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/use-auth';

import { shopKeys } from '../query-keys';
import { getMyStore, saveStore, setStoreOpen } from '../services/shop.service';
import type { MyStore } from '../types';
import type { ShopFormValues } from '../utils/shop-payload';

/** The signed-in owner's store. `data` is null until they have set one up. */
export function useMyStore(): UseQueryResult<MyStore | null, Error> {
  const { user } = useAuth();
  const ownerId = user?.id ?? null;

  return useQuery({
    queryKey: shopKeys.mine(ownerId),
    queryFn: () => (ownerId === null ? Promise.resolve(null) : getMyStore(ownerId)),
    enabled: ownerId !== null,
  });
}

interface SaveStoreInput {
  values: ShopFormValues;
  /** The store being edited; null while it is being created. */
  previous: MyStore | null;
}

/**
 * Creates or updates the store and puts the result straight into the cache, so every screen shows
 * the new details at once. Creating it also opens the rest of the store area (see the layout).
 */
export function useSaveStore(): UseMutationResult<MyStore, Error, SaveStoreInput> {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ values, previous }: SaveStoreInput) => saveStore(values, previous),
    onSuccess: (saved) => {
      queryClient.setQueryData(shopKeys.mine(user?.id ?? null), saved);
    },
  });
}

interface SetOpenInput {
  storeId: number;
  isOpen: boolean;
}

/** Flips the "accepting orders" switch. */
export function useSetStoreOpen(): UseMutationResult<MyStore, Error, SetOpenInput> {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ storeId, isOpen }: SetOpenInput) => setStoreOpen(storeId, isOpen),
    onSuccess: (saved) => {
      queryClient.setQueryData(shopKeys.mine(user?.id ?? null), saved);
    },
  });
}
