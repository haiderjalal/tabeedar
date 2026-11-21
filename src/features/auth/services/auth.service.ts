import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import type { LanguageCode } from '@/lib/i18n/config';
import { logger } from '@/lib/logger';
import { normalizePhone } from '@/lib/phone';
import { supabase } from '@/lib/supabase/client';

import { PROFILE_COLUMNS, parseProfileRow } from '../schemas/profile.schema';
import type { Profile, UserRole } from '../types';

/**
 * The only module that talks to Supabase Auth. Screens and hooks call these functions and never
 * import the Supabase client themselves.
 *
 * Failures are thrown as the original Supabase error. `toAuthErrorKey` turns them into a message
 * to show; nothing in here knows about translations or screens.
 */

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  role: UserRole;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  /** The language the app is showing now; saved on the profile. */
  language: LanguageCode;
}

export interface SignUpResult {
  /** True when the account exists but must be confirmed through an emailed link before sign-in. */
  needsEmailConfirmation: boolean;
}

export async function signInWithEmail({ email, password }: SignInInput): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    logger.warn('Sign-in failed', { code: error.code });
    throw error;
  }
}

export async function signUpWithEmail(input: SignUpInput): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      // Read by the database trigger that creates the profile. The trigger only accepts the
      // roles 'store' and 'rider' (anything else becomes 'customer'), so nothing here can
      // grant extra power.
      data: {
        role: input.role,
        full_name: input.fullName.trim(),
        phone: normalizePhone(input.phone),
        language: input.language,
      },
    },
  });

  if (error) {
    logger.warn('Sign-up failed', { code: error.code });
    throw error;
  }

  // With email confirmation switched on, Supabase creates the account but returns no session
  // until the link is opened. If the email already has an account it behaves the same way
  // (returning a user without an identity instead of an error), so the screen cannot be used to
  // find out which emails are registered.
  return { needsEmailConfirmation: data.session === null };
}

/** Signs out of this device only; the person's other devices stay signed in. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) {
    logger.warn('Sign-out failed', { code: error.code });
    throw error;
  }
}

/**
 * Calls `listener` with the current session straight away (after restoring a saved one) and again
 * whenever the person signs in, signs out or the session refreshes. Returns an unsubscribe function.
 *
 * Keep listeners synchronous: awaiting another Supabase call inside one can deadlock the client.
 */
export function subscribeToAuthChanges(
  listener: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange(listener);
  return () => data.subscription.unsubscribe();
}

/**
 * The signed-in person's own profile, or null if no profile row exists for them.
 * Row-level security means this can only ever return the caller's own row.
 */
export async function fetchOwnProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    logger.warn('Could not load profile', { code: error.code });
    throw error;
  }

  return data ? parseProfileRow(data) : null;
}
