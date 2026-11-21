import { z } from 'zod';

import type { Catalog, Category, Product, StoreDetails, StoreSummary } from '../types';

/**
 * Rows from the database are checked where they enter the app (see ADR 014). Numbers such as
 * ids and prices arrive as JSON numbers from Supabase's data API.
 */

const storeSummaryRow = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  area: z.string().nullable(),
  city: z.string(),
  logo_url: z.string().nullable(),
  is_open: z.boolean(),
  distance_m: z.number(),
  matching_products: z.array(z.string()).nullable(),
});

const storeRow = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  phone: z.string().nullable(),
  address_line: z.string(),
  area: z.string().nullable(),
  city: z.string(),
  logo_url: z.string().nullable(),
  cover_url: z.string().nullable(),
  is_open: z.boolean(),
});

const categoryRow = z.object({
  id: z.number().int(),
  name: z.string(),
  sort_order: z.number().int(),
});

const productRow = z.object({
  id: z.number().int(),
  store_id: z.number().int(),
  category_id: z.number().int().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().nonnegative(),
  image_url: z.string().nullable(),
  is_available: z.boolean(),
  sort_order: z.number().int(),
});

/** Columns to request, kept next to the schemas they must match. Never `select *`. */
export const STORE_COLUMNS =
  'id, name, description, phone, address_line, area, city, logo_url, cover_url, is_open';
export const CATEGORY_COLUMNS = 'id, name, sort_order';
export const PRODUCT_COLUMNS =
  'id, store_id, category_id, name, description, price, image_url, is_available, sort_order';

export function parseStoreSummaries(rows: unknown): StoreSummary[] {
  return z
    .array(storeSummaryRow)
    .parse(rows)
    .map((row): StoreSummary => ({
      id: row.id,
      name: row.name,
      description: row.description,
      area: row.area,
      city: row.city,
      logoPath: row.logo_url,
      isOpen: row.is_open,
      distanceM: row.distance_m,
      matchingProducts: row.matching_products ?? [],
    }));
}

export function parseStoreDetails(row: unknown): StoreDetails {
  const parsed = storeRow.parse(row);
  return {
    id: parsed.id,
    name: parsed.name,
    description: parsed.description,
    phone: parsed.phone,
    addressLine: parsed.address_line,
    area: parsed.area,
    city: parsed.city,
    logoPath: parsed.logo_url,
    coverPath: parsed.cover_url,
    isOpen: parsed.is_open,
  };
}

export function parseCategories(rows: unknown): Category[] {
  return z
    .array(categoryRow)
    .parse(rows)
    .map((row): Category => ({ id: row.id, name: row.name, sortOrder: row.sort_order }));
}

export function parseProducts(rows: unknown): Product[] {
  return z
    .array(productRow)
    .parse(rows)
    .map((row): Product => ({
      id: row.id,
      storeId: row.store_id,
      categoryId: row.category_id,
      name: row.name,
      description: row.description,
      price: row.price,
      imagePath: row.image_url,
      isAvailable: row.is_available,
      sortOrder: row.sort_order,
    }));
}

/** A single row, for results of inserts and updates. */
export function parseCategory(row: unknown): Category {
  const [category] = parseCategories([row]);
  if (!category) throw new Error('Expected one category.');
  return category;
}

export function parseProduct(row: unknown): Product {
  const [product] = parseProducts([row]);
  if (!product) throw new Error('Expected one product.');
  return product;
}

export function parseCatalog(categories: unknown, products: unknown): Catalog {
  return { categories: parseCategories(categories), products: parseProducts(products) };
}
