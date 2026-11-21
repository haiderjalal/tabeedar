/** Keys of `auth:errors` in the translation files. */
export type AuthErrorKey =
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'emailTaken'
  | 'weakPassword'
  | 'tooManyRequests'
  | 'network'
  | 'generic';

/** Supabase's machine-readable error codes that we give their own message. */
const CODE_TO_KEY: Record<string, AuthErrorKey> = {
  invalid_credentials: 'invalidCredentials',
  email_not_confirmed: 'emailNotConfirmed',
  user_already_exists: 'emailTaken',
  email_exists: 'emailTaken',
  weak_password: 'weakPassword',
  over_request_rate_limit: 'tooManyRequests',
  over_email_send_rate_limit: 'tooManyRequests',
};

/** Supabase wraps failed network calls in this error type. */
const NETWORK_ERROR_NAME = 'AuthRetryableFetchError';

function readString(source: object, field: string): string | undefined {
  const value = (source as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Picks the message to show for a failed sign-in or sign-up.
 *
 * We match on Supabase's error `code` (stable) and never show its raw `message` to the user
 * (technical, English-only, and sometimes reveals more than we want).
 */
export function toAuthErrorKey(error: unknown): AuthErrorKey {
  if (typeof error !== 'object' || error === null) return 'generic';

  if (readString(error, 'name') === NETWORK_ERROR_NAME) return 'network';

  const code = readString(error, 'code');
  if (code !== undefined) return CODE_TO_KEY[code] ?? 'generic';

  return 'generic';
}
