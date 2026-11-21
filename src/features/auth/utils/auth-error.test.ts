import { describe, expect, it } from 'vitest';

import { toAuthErrorKey } from './auth-error';

describe('toAuthErrorKey', () => {
  it.each([
    ['invalid_credentials', 'invalidCredentials'],
    ['email_not_confirmed', 'emailNotConfirmed'],
    ['user_already_exists', 'emailTaken'],
    ['email_exists', 'emailTaken'],
    ['weak_password', 'weakPassword'],
    ['over_request_rate_limit', 'tooManyRequests'],
    ['over_email_send_rate_limit', 'tooManyRequests'],
  ])('maps the Supabase code %s to %s', (code, expected) => {
    expect(
      toAuthErrorKey({ name: 'AuthApiError', code, message: 'raw message', status: 400 }),
    ).toBe(expected);
  });

  it('recognises a failed network call', () => {
    expect(
      toAuthErrorKey({
        name: 'AuthRetryableFetchError',
        message: 'Network request failed',
        status: 0,
      }),
    ).toBe('network');
  });

  it('falls back to the generic message for unknown codes and shapes', () => {
    expect(toAuthErrorKey({ name: 'AuthApiError', code: 'something_new', message: 'x' })).toBe(
      'generic',
    );
    expect(toAuthErrorKey({ message: 'no code at all' })).toBe('generic');
    expect(toAuthErrorKey(new Error('boom'))).toBe('generic');
    expect(toAuthErrorKey('a string')).toBe('generic');
    expect(toAuthErrorKey(null)).toBe('generic');
    expect(toAuthErrorKey(undefined)).toBe('generic');
  });

  it('never depends on the raw message text', () => {
    // A hostile or changed message must not change which text the user sees.
    expect(
      toAuthErrorKey({ code: 'invalid_credentials', message: 'Password for admin@x.com is wrong' }),
    ).toBe('invalidCredentials');
  });
});
