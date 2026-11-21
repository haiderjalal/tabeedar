import { isImagePathOfStore } from '@/features/media/utils/image-path';

import { formatPriceInput, parsePrice } from './price';

/** What the product form collects. The price is text because that is what a person types. */
export interface ProductFormValues {
  name: string;
  description: string;
  priceText: string;
  categoryId: number | null;
  imagePath: string | null;
  isAvailable: boolean;
}

/** The columns of the `products` table that the app writes (the store is added by the service). */
export interface ProductColumns {
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
}

/** Form values for a product that does not exist yet: in stock, no category, no picture. */
export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  description: '',
  priceText: '',
  categoryId: null,
  imagePath: null,
  isAvailable: true,
};

/** The form values that describe an existing product, for editing. */
export function toProductFormValues(product: {
  name: string;
  description: string | null;
  price: number;
  categoryId: number | null;
  imagePath: string | null;
  isAvailable: boolean;
}): ProductFormValues {
  return {
    name: product.name,
    description: product.description ?? '',
    priceText: formatPriceInput(product.price),
    categoryId: product.categoryId,
    imagePath: product.imagePath,
    isAvailable: product.isAvailable,
  };
}

/**
 * Converts form values to database columns: text is trimmed, a blank description becomes null and
 * the price text becomes a number. Throws if the price cannot be read or the picture is not inside
 * the store's own folder: the form schema and the picture field should have stopped both earlier.
 */
export function toProductColumns(values: ProductFormValues, storeId: number): ProductColumns {
  const price = parsePrice(values.priceText);
  if (price === null) throw new Error('The price is not valid.');
  if (values.imagePath !== null && !isImagePathOfStore(values.imagePath, storeId)) {
    throw new Error('The picture does not belong to this store.');
  }

  const description = values.description.trim();
  return {
    category_id: values.categoryId,
    name: values.name.trim(),
    description: description === '' ? null : description,
    price,
    image_url: values.imagePath,
    is_available: values.isAvailable,
  };
}
