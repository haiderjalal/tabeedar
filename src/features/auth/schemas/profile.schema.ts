import { z } from 'zod';

import { isLanguageCode, type LanguageCode } from '@/lib/i18n/config';

import { USER_ROLES, type Profile } from '../types';

/**
 * The shape of a `profiles` row as the database returns it.
 *
 * Data from the network is checked before the rest of the app trusts it. When generated
 * database types are added, this stays useful as a runtime guard (types alone are erased).
 */
const profileRowSchema = z.object({
  id: z.guid(),
  role: z.enum(USER_ROLES),
  full_name: z.string().nullable(),
  phone: z.string().nullable(),
  language: z.custom<LanguageCode>(isLanguageCode),
});

/** The columns to request for a profile; keep in step with `profileRowSchema`. */
export const PROFILE_COLUMNS = 'id, role, full_name, phone, language';

/**
 * Validates a raw `profiles` row and converts it to the app's `Profile`.
 * Throws if the row does not look as expected.
 */
export function parseProfileRow(row: unknown): Profile {
  const parsed = profileRowSchema.parse(row);
  return {
    id: parsed.id,
    role: parsed.role,
    fullName: parsed.full_name,
    phone: parsed.phone,
    language: parsed.language,
  };
}
