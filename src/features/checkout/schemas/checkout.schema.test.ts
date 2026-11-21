import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';

import { createCheckoutSchema } from './checkout.schema';

const t = ((key: string) => key) as unknown as TFunction<'checkout'>;
const schema = createCheckoutSchema(t);
const valid = { recipientName: 'Sara Khan', recipientPhone: '0300 1234567', notes: '' };

function failures(input: unknown): string[] {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('checkout schema', () => {
  it('accepts a recipient with no note, or with one', () => {
    expect(schema.safeParse(valid).success).toBe(true);
    expect(schema.safeParse({ ...valid, notes: 'Leave with the guard' }).success).toBe(true);
  });

  it('needs the recipient name, ignoring spaces', () => {
    expect(failures({ ...valid, recipientName: '   ' })).toContain('validation.nameRequired');
    expect(schema.parse({ ...valid, recipientName: '  Sara  ' }).recipientName).toBe('Sara');
  });

  it('needs a phone number the database will accept', () => {
    expect(failures({ ...valid, recipientPhone: '' })).toContain('validation.phoneInvalid');
    expect(failures({ ...valid, recipientPhone: 'call me' })).toContain('validation.phoneInvalid');
    expect(schema.safeParse({ ...valid, recipientPhone: '+92 300 1234567' }).success).toBe(true);
  });

  it('keeps name and note within the database limits', () => {
    expect(failures({ ...valid, recipientName: 'x'.repeat(121) })).toContain('validation.tooLong');
    expect(failures({ ...valid, notes: 'x'.repeat(501) })).toContain('validation.tooLong');
    expect(schema.safeParse({ ...valid, notes: 'x'.repeat(500) }).success).toBe(true);
  });
});
