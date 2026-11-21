import { describe, expect, it } from 'vitest';

import { toCatalogErrorKey } from './catalog-error';

describe('toCatalogErrorKey', () => {
  it('recognises a category name that is already used', () => {
    expect(toCatalogErrorKey({ code: '23505', message: 'duplicate key value' })).toBe(
      'duplicateName',
    );
  });

  it('recognises a lost connection', () => {
    expect(toCatalogErrorKey({ code: '', message: 'Failed to fetch' })).toBe('network');
  });

  it('falls back to a generic message', () => {
    expect(toCatalogErrorKey({ code: '42501', message: 'permission denied' })).toBe('generic');
    expect(toCatalogErrorKey(null)).toBe('generic');
  });
});
