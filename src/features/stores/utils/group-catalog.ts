import type { Catalog, CatalogSection, Product } from '../types';

const OTHER_KEY = 'other';

function byPosition(a: Product, b: Product): number {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}

/**
 * Arranges a store's products under their category headings for the store page.
 * Categories follow the order the store chose; empty categories are left out; products without a
 * category come last under a heading of their own (`title: null`, the screen names it).
 */
export function groupCatalog(catalog: Catalog): CatalogSection[] {
  const sections: CatalogSection[] = [];

  const categories = [...catalog.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
  for (const category of categories) {
    const data = catalog.products.filter((p) => p.categoryId === category.id).sort(byPosition);
    if (data.length > 0) sections.push({ key: String(category.id), title: category.name, data });
  }

  const knownCategoryIds = new Set(catalog.categories.map((c) => c.id));
  const uncategorised = catalog.products
    .filter((p) => p.categoryId === null || !knownCategoryIds.has(p.categoryId))
    .sort(byPosition);
  if (uncategorised.length > 0) sections.push({ key: OTHER_KEY, title: null, data: uncategorised });

  return sections;
}
