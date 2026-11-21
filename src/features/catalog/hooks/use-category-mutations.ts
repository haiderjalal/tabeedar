import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import type { Category } from '@/features/stores/types';

import { createCategory, deleteCategory, renameCategory } from '../services/catalog.service';
import { removeCategory, upsertCategory } from '../utils/catalog-cache';

import { useCatalogCache } from './use-catalog-cache';

/** Category changes for one store. Each updates the cached catalog at once and confirms in the background. */

export function useCreateCategory(storeId: number): UseMutationResult<Category, Error, string> {
  const cache = useCatalogCache(storeId);
  return useMutation({
    mutationFn: (name: string) => createCategory(storeId, name),
    onSuccess: (category) => cache.update((catalog) => upsertCategory(catalog, category)),
  });
}

interface RenameCategoryInput {
  categoryId: number;
  name: string;
}

export function useRenameCategory(
  storeId: number,
): UseMutationResult<Category, Error, RenameCategoryInput> {
  const cache = useCatalogCache(storeId);
  return useMutation({
    mutationFn: ({ categoryId, name }: RenameCategoryInput) => renameCategory(categoryId, name),
    onSuccess: (category) => cache.update((catalog) => upsertCategory(catalog, category)),
  });
}

export function useDeleteCategory(storeId: number): UseMutationResult<void, Error, number> {
  const cache = useCatalogCache(storeId);
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (_result, categoryId) =>
      cache.update((catalog) => removeCategory(catalog, categoryId)),
  });
}
