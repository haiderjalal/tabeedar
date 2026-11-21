import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';

import { createAddressFormSchema, parseAddress, parseAddresses } from './address.schema';

const t = ((key: string) => key) as unknown as TFunction<'addresses'>;
const schema = createAddressFormSchema(t);

const valid = {
  label: 'Home',
  recipientName: '',
  recipientPhone: '',
  addressLine: 'House 21, Street 4',
  area: 'G-8',
  city: 'Islamabad',
  instructions: '',
  latitude: 33.708,
  longitude: 73.042,
  isDefault: false,
};

function failures(input: unknown): string[] {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('address form schema', () => {
  it('accepts a complete address, with the optional fields blank', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('accepts an address for someone else', () => {
    expect(
      schema.safeParse({ ...valid, recipientName: 'Mum', recipientPhone: '0300 1234500' }).success,
    ).toBe(true);
  });

  it('requires a label, street address and city, ignoring spaces', () => {
    expect(failures({ ...valid, label: '  ' })).toContain('validation.labelRequired');
    expect(failures({ ...valid, addressLine: '' })).toContain('validation.addressRequired');
    expect(failures({ ...valid, city: '   ' })).toContain('validation.cityRequired');
  });

  it('enforces the same maximum lengths as the database', () => {
    expect(failures({ ...valid, label: 'x'.repeat(41) })).toContain('validation.tooLong');
    expect(failures({ ...valid, addressLine: 'x'.repeat(301) })).toContain('validation.tooLong');
    expect(failures({ ...valid, instructions: 'x'.repeat(301) })).toContain('validation.tooLong');
    expect(schema.safeParse({ ...valid, label: 'x'.repeat(40) }).success).toBe(true);
  });

  it('checks a recipient phone only when one is given', () => {
    expect(failures({ ...valid, recipientPhone: 'abc' })).toContain('validation.phoneInvalid');
    expect(schema.safeParse({ ...valid, recipientPhone: '' }).success).toBe(true);
    expect(schema.safeParse({ ...valid, recipientPhone: '   ' }).success).toBe(true);
  });

  it('is not valid until the map position is set', () => {
    expect(failures({ ...valid, latitude: null, longitude: null })).toContain(
      'validation.locationRequired',
    );
    expect(failures({ ...valid, latitude: 33.7, longitude: null })).toContain(
      'validation.locationRequired',
    );
  });

  it('rejects a position that cannot exist', () => {
    expect(failures({ ...valid, latitude: 95 })).toContain('validation.locationRequired');
    expect(failures({ ...valid, longitude: 200 })).toContain('validation.locationRequired');
  });
});

const row = {
  id: 7,
  label: 'Home',
  recipient_name: null,
  recipient_phone: null,
  address_line: 'House 21',
  area: null,
  city: 'Islamabad',
  instructions: null,
  latitude: 33.708,
  longitude: 73.042,
  is_default: true,
};

describe('parseAddresses', () => {
  it('converts rows to the app shape', () => {
    expect(parseAddress(row)).toEqual({
      id: 7,
      label: 'Home',
      recipientName: null,
      recipientPhone: null,
      addressLine: 'House 21',
      area: null,
      city: 'Islamabad',
      instructions: null,
      latitude: 33.708,
      longitude: 73.042,
      isDefault: true,
    });
    expect(parseAddresses([row, { ...row, id: 8 }])).toHaveLength(2);
  });

  it('rejects rows that are not addresses', () => {
    expect(() => parseAddress({ ...row, latitude: '33.7' })).toThrow();
    expect(() => parseAddresses([{ id: 1 }])).toThrow();
    expect(() => parseAddresses(null)).toThrow();
  });
});
