import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';

import { createSignInSchema } from './sign-in.schema';

const t = ((key: string) => key) as unknown as TFunction<'auth'>;
const schema = createSignInSchema(t);

describe('sign-in schema', () => {
  it('accepts an email and any non-empty password', () => {
    expect(schema.safeParse({ email: 'sara@example.com', password: 'x' }).success).toBe(true);
  });

  it('does not apply the sign-up length rule, so old short passwords still work', () => {
    expect(schema.safeParse({ email: 'sara@example.com', password: '123456' }).success).toBe(true);
  });

  it('rejects an empty password and a malformed email', () => {
    const noPassword = schema.safeParse({ email: 'sara@example.com', password: '' });
    expect(noPassword.success).toBe(false);
    expect(noPassword.error?.issues[0]?.message).toBe('validation.passwordRequired');

    const badEmail = schema.safeParse({ email: 'nope', password: 'x' });
    expect(badEmail.success).toBe(false);
    expect(badEmail.error?.issues[0]?.message).toBe('validation.emailInvalid');
  });

  it('trims the email', () => {
    expect(schema.parse({ email: '  sara@example.com ', password: 'x' }).email).toBe(
      'sara@example.com',
    );
  });
});
