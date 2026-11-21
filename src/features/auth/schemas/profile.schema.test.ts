import { describe, expect, it } from 'vitest';

import { parseProfileRow } from './profile.schema';

const row = {
  id: 'a0000000-0000-4000-8000-000000000003',
  role: 'customer',
  full_name: 'Sara Khan',
  phone: '+923001000003',
  language: 'ur',
};

describe('parseProfileRow', () => {
  it('converts a database row to the app profile', () => {
    expect(parseProfileRow(row)).toEqual({
      id: 'a0000000-0000-4000-8000-000000000003',
      role: 'customer',
      fullName: 'Sara Khan',
      phone: '+923001000003',
      language: 'ur',
    });
  });

  it('allows a missing name and phone', () => {
    const profile = parseProfileRow({ ...row, full_name: null, phone: null });
    expect(profile.fullName).toBeNull();
    expect(profile.phone).toBeNull();
  });

  it.each(['customer', 'store', 'rider'])('accepts the %s role', (role) => {
    expect(parseProfileRow({ ...row, role }).role).toBe(role);
  });

  it('rejects data that is not a valid profile', () => {
    expect(() => parseProfileRow({ ...row, role: 'admin' })).toThrow();
    expect(() => parseProfileRow({ ...row, language: 'fr' })).toThrow();
    expect(() => parseProfileRow({ ...row, id: 'not-a-uuid' })).toThrow();
    expect(() => parseProfileRow({ ...row, full_name: undefined })).toThrow();
    expect(() => parseProfileRow(null)).toThrow();
    expect(() => parseProfileRow(undefined)).toThrow();
  });
});
