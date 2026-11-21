/** A store as shown in a list of search results. */
export interface StoreSummary {
  id: number;
  name: string;
  description: string | null;
  area: string | null;
  city: string;
  /** Path of the logo in the catalog bucket. Turn it into an address with `publicImageUrl`. */
  logoPath: string | null;
  isOpen: boolean;
  /** Straight-line distance from the address the search was made for, in metres. */
  distanceM: number;
  /** Up to three product names that matched the search text. Empty when nothing was searched. */
  matchingProducts: string[];
}

/** Everything the store page needs to show about the store itself. */
export interface StoreDetails {
  id: number;
  name: string;
  description: string | null;
  phone: string | null;
  addressLine: string;
  area: string | null;
  city: string;
  logoPath: string | null;
  coverPath: string | null;
  isOpen: boolean;
}

export interface Category {
  id: number;
  name: string;
  sortOrder: number;
}

export interface Product {
  id: number;
  storeId: number;
  categoryId: number | null;
  name: string;
  description: string | null;
  /** Rupees. */
  price: number;
  /** Path of the product photo in the catalog bucket. */
  imagePath: string | null;
  isAvailable: boolean;
  sortOrder: number;
}

export interface Catalog {
  categories: Category[];
  products: Product[];
}

/** One heading on the store page with the products under it. */
export interface CatalogSection {
  /** Category id, or the text "other" for products without a category. */
  key: string;
  title: string | null;
  data: Product[];
}
