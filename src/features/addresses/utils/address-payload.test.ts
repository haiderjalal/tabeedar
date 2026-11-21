import { describe, expect, it } from 'vitest';

import { toAddressPayload, type AddressFormValues } from './address-payload';

const filled: AddressFormValues = {
  label: '  Home ',
  recipientName: ' Mum ',
  recipientPhone: '0300 1234500',
  addressLine: ' House 9, Street 2 ',
  area: ' F-7 ',
  city: ' Islamabad ',
  instructions: ' Green gate ',
  latitude: 33.708,
  longitude: 73.042,
  isDefault: true,
};

describe('toAddressPayload', () => {
  it('trims text and normalizes the phone number', () => {
    expect(toAddressPayload(filled)).toEqual({
      label: 'Home',
      recipient_name: 'Mum',
      recipient_phone: '+923001234500',
      address_line: 'House 9, Street 2',
      area: 'F-7',
      city: 'Islamabad',
      instructions: 'Green gate',
      latitude: 33.708,
      longitude: 73.042,
      is_default: true,
    });
  });

  it('turns blank optional fields into null, because the database rejects empty strings', () => {
    const payload = toAddressPayload({
      ...filled,
      recipientName: '',
      recipientPhone: '   ',
      area: '',
      instructions: '  ',
    });
    expect(payload.recipient_name).toBeNull();
    expect(payload.recipient_phone).toBeNull();
    expect(payload.area).toBeNull();
    expect(payload.instructions).toBeNull();
  });

  it('refuses to build an address without a map position', () => {
    expect(() => toAddressPayload({ ...filled, latitude: null })).toThrow();
    expect(() => toAddressPayload({ ...filled, longitude: null })).toThrow();
  });
});
