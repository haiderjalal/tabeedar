import { describe, expect, it } from 'vitest';

import { buildOrderSignature, type OrderSignatureInput } from './order-signature';

const base: OrderSignatureInput = {
  storeId: 1,
  lines: [
    { productId: 10, quantity: 2 },
    { productId: 11, quantity: 1 },
  ],
  addressId: 5,
  recipientName: 'Sara Khan',
  recipientPhone: '+923001234567',
  notes: '',
};

describe('buildOrderSignature', () => {
  it('is the same for the same order', () => {
    expect(buildOrderSignature(base)).toBe(buildOrderSignature({ ...base }));
  });

  it('does not depend on the order of the lines', () => {
    const reversed = { ...base, lines: [...base.lines].reverse() };
    expect(buildOrderSignature(reversed)).toBe(buildOrderSignature(base));
  });

  it('ignores spaces around typed text', () => {
    expect(buildOrderSignature({ ...base, recipientName: '  Sara Khan ', notes: '  ' })).toBe(
      buildOrderSignature(base),
    );
  });

  it.each([
    ['the store', { storeId: 2 }],
    [
      'a quantity',
      {
        lines: [
          { productId: 10, quantity: 3 },
          { productId: 11, quantity: 1 },
        ],
      },
    ],
    ['an extra item', { lines: [...base.lines, { productId: 12, quantity: 1 }] }],
    ['the address', { addressId: 6 }],
    ['the recipient name', { recipientName: 'Omar' }],
    ['the recipient phone', { recipientPhone: '+923009999999' }],
    ['the note', { notes: 'Ring twice' }],
  ])('changes when %s changes', (_what, change) => {
    expect(buildOrderSignature({ ...base, ...change })).not.toBe(buildOrderSignature(base));
  });
});
