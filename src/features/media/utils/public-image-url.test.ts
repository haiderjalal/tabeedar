import { describe, expect, it } from 'vitest';

import { buildPublicImageUrl } from './public-image-url';

describe('buildPublicImageUrl', () => {
  it('points at the public bucket', () => {
    expect(buildPublicImageUrl('https://abc.supabase.co', 'stores/12/logo/a.jpg')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/catalog-images/stores/12/logo/a.jpg',
    );
  });

  it('ignores a trailing slash on the project address', () => {
    expect(buildPublicImageUrl('https://abc.supabase.co/', 'stores/1/logo/a.jpg')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/catalog-images/stores/1/logo/a.jpg',
    );
  });

  it('encodes each part of the path but keeps the slashes', () => {
    expect(buildPublicImageUrl('http://localhost:54321', 'stores/1/product/a b.jpg')).toBe(
      'http://localhost:54321/storage/v1/object/public/catalog-images/stores/1/product/a%20b.jpg',
    );
  });

  it('returns null when there is no picture', () => {
    expect(buildPublicImageUrl('https://abc.supabase.co', null)).toBeNull();
    expect(buildPublicImageUrl('https://abc.supabase.co', '')).toBeNull();
  });
});
