import type { TFunction } from 'i18next';
import { z } from 'zod';

import { isValidPhone, normalizePhone } from '@/lib/phone';

import { MAX_NAME_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '../constants';
import { USER_ROLES } from '../types';

import { emailField } from './fields';

/**
 * Validation for the sign-up form. The same rules are enforced again by Supabase Auth and by
 * database constraints; this copy exists to give people fast, specific feedback.
 *
 * `phone` is validated here but stored exactly as typed in the form. Call `normalizePhone` when
 * sending it, which keeps this schema's input and output types identical for the form library.
 */
export function createSignUpSchema(t: TFunction<'auth'>) {
  return z.object({
    role: z.enum(USER_ROLES),
    fullName: z
      .string()
      .trim()
      .min(1, t('validation.fullNameRequired'))
      .max(MAX_NAME_LENGTH, t('validation.fullNameTooLong', { max: MAX_NAME_LENGTH })),
    phone: z.string().refine((value) => isValidPhone(normalizePhone(value)), {
      error: t('validation.phoneInvalid'),
    }),
    email: emailField(t),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, t('validation.passwordTooShort', { min: MIN_PASSWORD_LENGTH }))
      .max(MAX_PASSWORD_LENGTH, t('validation.passwordTooLong', { max: MAX_PASSWORD_LENGTH })),
  });
}

export type SignUpValues = z.infer<ReturnType<typeof createSignUpSchema>>;
