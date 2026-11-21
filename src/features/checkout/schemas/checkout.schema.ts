import type { TFunction } from 'i18next';
import { z } from 'zod';

import { isValidPhone, normalizePhone } from '@/lib/phone';

/** Same limits as the `orders` table. */
export const MAX_RECIPIENT_NAME_LENGTH = 120;
export const MAX_NOTES_LENGTH = 500;

/**
 * The part of checkout the customer types: who receives the order and an optional note. The
 * address comes from the address picker and the items from the cart.
 */
export function createCheckoutSchema(t: TFunction<'checkout'>) {
  return z.object({
    recipientName: z
      .string()
      .trim()
      .min(1, t('validation.nameRequired'))
      .max(MAX_RECIPIENT_NAME_LENGTH, t('validation.tooLong', { max: MAX_RECIPIENT_NAME_LENGTH })),
    recipientPhone: z.string().refine((value) => isValidPhone(normalizePhone(value)), {
      error: t('validation.phoneInvalid'),
    }),
    notes: z
      .string()
      .trim()
      .max(MAX_NOTES_LENGTH, t('validation.tooLong', { max: MAX_NOTES_LENGTH })),
  });
}

export type CheckoutFormValues = z.infer<ReturnType<typeof createCheckoutSchema>>;
