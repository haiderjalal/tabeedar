import { describe, expect, it } from 'vitest';

import { MediaError, toMediaErrorKey } from './media-error';

describe('toMediaErrorKey', () => {
  it('uses the code of a media error', () => {
    expect(toMediaErrorKey(new MediaError('too_large'))).toBe('too_large');
    expect(toMediaErrorKey(new MediaError('unreadable'))).toBe('unreadable');
  });

  it('treats anything else as a failed upload', () => {
    expect(toMediaErrorKey(new Error('network'))).toBe('upload_failed');
    expect(toMediaErrorKey('boom')).toBe('upload_failed');
    expect(toMediaErrorKey(null)).toBe('upload_failed');
  });
});
