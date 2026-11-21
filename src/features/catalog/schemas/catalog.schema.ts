import type { TFunction } from 'i18next';
import { z } from 'zod';

import {
  MAX_CATEGORY_NAME_LENGTH,
  MAX_PRODUCT_DESCRIPTION_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
} from '../constants';
import { parsePrice } from '../utils/price';

/**
 * Validation for the catalog forms, with messages in the current language. The same limits exist as
 * database constraints; these give the store owner a clear message before anything is sent.
 */

export function createCategoryFormSchema(t: TFunction<'catalog'>) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('validation.categoryNameRequired'))
      .max(MAX_CATEGORY_NAME_LENGTH, t('validation.tooLong', { max: MAX_CATEGORY_NAME_LENGTH })),
  });
}

export function createProductFormSchema(t: TFunction<'catalog'>) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('validation.productNameRequired'))
      .max(MAX_PRODUCT_NAME_LENGTH, t('validation.tooLong', { max: MAX_PRODUCT_NAME_LENGTH })),
    description: z
      .string()
      .trim()
      .max(
        MAX_PRODUCT_DESCRIPTION_LENGTH,
        t('validation.tooLong', { max: MAX_PRODUCT_DESCRIPTION_LENGTH }),
      ),
    priceText: z.string().refine((value) => parsePrice(value) !== null, {
      error: t('validation.priceInvalid'),
    }),
    categoryId: z.number().int().nullable(),
    imagePath: z.string().nullable(),
    isAvailable: z.boolean(),
  });
}
