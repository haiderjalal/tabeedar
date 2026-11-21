import type { TFunction } from 'i18next';
import { z } from 'zod';

/** An email address; surrounding spaces (common with autofill) are ignored. */
export function emailField(t: TFunction<'auth'>) {
  return z
    .string()
    .trim()
    .pipe(z.email(t('validation.emailInvalid')));
}
