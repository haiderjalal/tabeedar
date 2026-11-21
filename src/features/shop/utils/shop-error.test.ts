import { describe, expect, it } from 'vitest';

import { toShopErrorKey } from './shop-error';

describe('toShopErrorKey', () => {
  it('recognises a second store for the same account', () => {
    expect(toShopErrorKey({ code: '23505', message: 'duplicate key value' })).toBe(
      'alreadyHasStore',
    );
  });

  it('recognises a lost connection', () => {
    expect(toShopErrorKey({ code: '', message: 'Network request failed' })).toBe('network');
  });

  it('falls back to a generic message', () => {
    expect(toShopErrorKey({ code: '42501', message: 'permission denied' })).toBe('generic');
    expect(toShopErrorKey(undefined)).toBe('generic');
  });
});
