import { describe, expect, it } from 'vitest';

import { buildImagePath, isImagePathOfStore } from './image-path';

describe('buildImagePath', () => {
  it('puts the picture in the store folder, grouped by kind', () => {
    expect(buildImagePath(12, 'product', 'abc-123')).toBe('stores/12/product/abc-123.jpg');
    expect(buildImagePath(12, 'logo', 'x')).toBe('stores/12/logo/x.jpg');
  });
});

describe('isImagePathOfStore', () => {
  it('accepts paths inside the store folder', () => {
    expect(isImagePathOfStore('stores/12/cover/a.jpg', 12)).toBe(true);
  });

  it('rejects another store, including ids that only share a prefix', () => {
    expect(isImagePathOfStore('stores/12/cover/a.jpg', 1)).toBe(false);
    expect(isImagePathOfStore('stores/120/cover/a.jpg', 12)).toBe(false);
  });

  it('rejects paths that climb out of the folder', () => {
    expect(isImagePathOfStore('stores/12/../13/a.jpg', 12)).toBe(false);
  });

  it('rejects addresses that are not bucket paths', () => {
    expect(isImagePathOfStore('https://example.com/stores/12/a.jpg', 12)).toBe(false);
  });
});
