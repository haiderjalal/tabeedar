import type { TFunction } from 'i18next';
import { z } from 'zod';

import { emailField } from './fields';

/**
 * Validation for the sign-in form. It is built from `t` so error messages are in the current
 * language. The password is only checked for presence here: Supabase decides whether it is right,
 * and an old password must never be rejected by a newer rule.
 */
export function createSignInSchema(t: TFunction<'auth'>) {
  return z.object({
    email: emailField(t),
    password: z.string().min(1, t('validation.passwordRequired')),
  });
}

export type SignInValues = z.infer<ReturnType<typeof createSignInSchema>>;
