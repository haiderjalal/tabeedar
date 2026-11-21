import type { LanguageCode } from '@/lib/i18n/config';

/**
 * The three areas of the app. Chosen at sign-up and stored in `profiles.role`. It decides which
 * screens a person sees; it grants no power by itself (the database enforces what they can do).
 */
export const USER_ROLES = ['customer', 'store', 'rider'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** The signed-in person's own profile, as the app uses it. */
export interface Profile {
  id: string;
  role: UserRole;
  fullName: string | null;
  phone: string | null;
  language: LanguageCode;
}

/**
 * Where the user is in the sign-in lifecycle.
 * - loading: restoring a saved session, or fetching the profile after sign-in
 * - signedOut: no session
 * - ready: signed in and the profile is loaded
 * - error: signed in, but the profile could not be loaded (offline, or the row is missing)
 */
export type AuthStatus = 'loading' | 'signedOut' | 'ready' | 'error';
