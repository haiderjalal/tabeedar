import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';

import { createSignUpSchema } from './sign-up.schema';

// Messages come back as their translation keys, so tests can check *which* rule failed.
const t = ((key: string) => key) as unknown as TFunction<'auth'>;
const schema = createSignUpSchema(t);

const valid = {
  role: 'customer',
  fullName: 'Sara Khan',
  phone: '0300 1234567',
  email: 'sara@example.com',
  password: 'long-enough-1',
};

function failures(input: unknown): string[] {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('sign-up schema', () => {
  it('accepts a complete, valid form', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it.each(['customer', 'store', 'rider'])('accepts the %s role', (role) => {
    expect(schema.safeParse({ ...valid, role }).success).toBe(true);
  });

  it('rejects any other role, including admin', () => {
    expect(schema.safeParse({ ...valid, role: 'admin' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, role: '' }).success).toBe(false);
  });

  it('requires a name, ignoring surrounding spaces', () => {
    expect(failures({ ...valid, fullName: '   ' })).toContain('validation.fullNameRequired');
    expect(failures({ ...valid, fullName: 'a'.repeat(121) })).toContain(
      'validation.fullNameTooLong',
    );
    expect(schema.parse({ ...valid, fullName: '  Sara Khan  ' }).fullName).toBe('Sara Khan');
  });

  it('checks the phone number the same way the database will', () => {
    expect(failures({ ...valid, phone: 'abc' })).toContain('validation.phoneInvalid');
    expect(failures({ ...valid, phone: '' })).toContain('validation.phoneInvalid');
    expect(failures({ ...valid, phone: '123' })).toContain('validation.phoneInvalid');
    expect(schema.safeParse({ ...valid, phone: '+92 300 1234567' }).success).toBe(true);
    expect(schema.safeParse({ ...valid, phone: '051-1234567' }).success).toBe(true);
  });

  it('checks the email and trims it', () => {
    expect(failures({ ...valid, email: 'not-an-email' })).toContain('validation.emailInvalid');
    expect(failures({ ...valid, email: '' })).toContain('validation.emailInvalid');
    expect(schema.parse({ ...valid, email: '  sara@example.com  ' }).email).toBe(
      'sara@example.com',
    );
  });

  it('enforces the password length rules', () => {
    expect(failures({ ...valid, password: '1234567' })).toContain('validation.passwordTooShort');
    expect(schema.safeParse({ ...valid, password: '12345678' }).success).toBe(true);
    expect(schema.safeParse({ ...valid, password: 'a'.repeat(72) }).success).toBe(true);
    expect(failures({ ...valid, password: 'a'.repeat(73) })).toContain(
      'validation.passwordTooLong',
    );
  });

  it('does not trim the password, since spaces may be intentional', () => {
    expect(schema.parse({ ...valid, password: '  spaces here  ' }).password).toBe(
      '  spaces here  ',
    );
  });

  it('rejects missing fields', () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ role: 'customer' }).success).toBe(false);
  });
});
