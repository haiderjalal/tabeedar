import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import type { Catalog, Product } from '@/features/stores/types';

import {
  createProduct,
  deleteProduct,
  setProductAvailable,
  updateProduct,
} from '../services/catalog.service';
import {
  removeProduct,
  setProductAvailable as markAvailable,
  upsertProduct,
} from '../utils/catalog-cache';
import type { ProductFormValues } from '../utils/product-payload';

import { useCatalogCache } from './use-catalog-cache';

/** Product changes for one store. Same approach as the category hooks: update the cache, then confirm. */

interface SaveProductInput {
  values: ProductFormValues;
  /** The product being edited. Omit to create a new one. */
  previous?: Product;
}

export function useSaveProduct(
  storeId: number,
): UseMutationResult<Product, Error, SaveProductInput> {
  const cache = useCatalogCache(storeId);
  return useMutation({
    mutationFn: ({ values, previous }: SaveProductInput) =>
      previous ? updateProduct(previous, values) : createProduct(storeId, values),
    onSuccess: (product) => cache.update((catalog) => upsertProduct(catalog, product)),
  });
}

export function useDeleteProduct(storeId: number): UseMutationResult<void, Error, Product> {
  const cache = useCatalogCache(storeId);
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_result, product) => cache.update((catalog) => removeProduct(catalog, product.id)),
  });
}

interface SetAvailableInput {
  productId: number;
  isAvailable: boolean;
}

interface SetAvailableContext {
  previous: Catalog | undefined;
}

/**
 * The in-stock switch. This one changes the screen immediately and puts it back if the save fails,
 * because a switch that lags behind the finger feels broken.
 */
export function useSetProductAvailable(
  storeId: number,
): UseMutationResult<Product, Error, SetAvailableInput, SetAvailableContext> {
  const { queryClient, queryKey } = useCatalogCache(storeId);

  return useMutation({
    mutationFn: ({ productId, isAvailable }: SetAvailableInput) =>
      setProductAvailable(productId, isAvailable),
    onMutate: async ({ productId, isAvailable }) => {
      // A refresh that is already running would overwrite the change with the old value.
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Catalog>(queryKey);
      queryClient.setQueryData<Catalog>(queryKey, (catalog) =>
        catalog ? markAvailable(catalog, productId, isAvailable) : catalog,
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
