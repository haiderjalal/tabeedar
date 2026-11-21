import { removeStoreImage } from '@/features/media/services/media.service';
import { unusedPaths } from '@/features/media/utils/unused-paths';
import {
  CATEGORY_COLUMNS,
  PRODUCT_COLUMNS,
  parseCategory,
  parseProduct,
} from '@/features/stores/schemas/store.schema';
import type { Category, Product } from '@/features/stores/types';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

import { toProductColumns, type ProductFormValues } from '../utils/product-payload';

/**
 * Changing a store's categories and products. Row-level security allows these writes only to the
 * store's owner, and the database keeps a product in its own store and refuses another store's
 * category, so none of this can touch anyone else's catalog.
 */

function fail(message: string, error: { code: string }): never {
  logger.warn(message, { code: error.code });
  throw error;
}

// ---------------------------------------------------------------------------------- categories

export async function createCategory(storeId: number, name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ store_id: storeId, name: name.trim() })
    .select(CATEGORY_COLUMNS)
    .single();
  if (error) fail('Could not create category', error);
  return parseCategory(data);
}

export async function renameCategory(categoryId: number, name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', categoryId)
    .select(CATEGORY_COLUMNS)
    .single();
  if (error) fail('Could not rename category', error);
  return parseCategory(data);
}

/** Deletes the category. Its products stay in the store, without a category (done by the database). */
export async function deleteCategory(categoryId: number): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) fail('Could not delete category', error);
}

// ----------------------------------------------------------------------------------- products

export async function createProduct(storeId: number, values: ProductFormValues): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({ store_id: storeId, ...toProductColumns(values, storeId) })
    .select(PRODUCT_COLUMNS)
    .single();
  if (error) fail('Could not create product', error);
  return parseProduct(data);
}

/** Saves the edited product, then deletes its old picture if the picture was replaced or removed. */
export async function updateProduct(
  previous: Product,
  values: ProductFormValues,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(toProductColumns(values, previous.storeId))
    .eq('id', previous.id)
    .select(PRODUCT_COLUMNS)
    .single();
  if (error) fail('Could not update product', error);

  const saved = parseProduct(data);
  await Promise.all(unusedPaths([previous.imagePath], [saved.imagePath]).map(removeStoreImage));
  return saved;
}

/** The "in stock / out of stock" switch. Out-of-stock products stay visible but cannot be ordered. */
export async function setProductAvailable(
  productId: number,
  isAvailable: boolean,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ is_available: isAvailable })
    .eq('id', productId)
    .select(PRODUCT_COLUMNS)
    .single();
  if (error) fail('Could not change stock state', error);
  return parseProduct(data);
}

/**
 * Deletes the product, then its picture. Past orders keep their own copy of the name and price, so
 * history is not affected.
 */
export async function deleteProduct(product: Product): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', product.id);
  if (error) fail('Could not delete product', error);
  if (product.imagePath !== null) await removeStoreImage(product.imagePath);
}
