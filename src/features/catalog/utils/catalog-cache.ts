import type { Catalog, Category, Product } from '@/features/stores/types';

/**
 * Pure updates of the cached catalog, applied right after a save so the screen changes at once;
 * the catalog is then re-read in the background to confirm. They never modify the catalog they are
 * given (the cache must always receive a new object).
 */

export function upsertCategory(catalog: Catalog, category: Category): Catalog {
  const exists = catalog.categories.some((c) => c.id === category.id);
  return {
    ...catalog,
    categories: exists
      ? catalog.categories.map((c) => (c.id === category.id ? category : c))
      : [...catalog.categories, category],
  };
}

/** Removes the category; its products stay in the store, just without a category (as in the database). */
export function removeCategory(catalog: Catalog, categoryId: number): Catalog {
  return {
    categories: catalog.categories.filter((c) => c.id !== categoryId),
    products: catalog.products.map((p) =>
      p.categoryId === categoryId ? { ...p, categoryId: null } : p,
    ),
  };
}

export function upsertProduct(catalog: Catalog, product: Product): Catalog {
  const exists = catalog.products.some((p) => p.id === product.id);
  return {
    ...catalog,
    products: exists
      ? catalog.products.map((p) => (p.id === product.id ? product : p))
      : [...catalog.products, product],
  };
}

export function removeProduct(catalog: Catalog, productId: number): Catalog {
  return { ...catalog, products: catalog.products.filter((p) => p.id !== productId) };
}

export function setProductAvailable(
  catalog: Catalog,
  productId: number,
  isAvailable: boolean,
): Catalog {
  return {
    ...catalog,
    products: catalog.products.map((p) => (p.id === productId ? { ...p, isAvailable } : p)),
  };
}
