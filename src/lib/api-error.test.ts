import { describe, expect, it } from 'vitest';

import { isNetworkError, readApiError } from './api-error';

describe('readApiError', () => {
  it('reads code and message from an error-like object', () => {
    expect(readApiError({ code: 'P0001', message: 'store_unavailable', details: null })).toEqual({
      code: 'P0001',
      message: 'store_unavailable',
    });
  });

  it('copes with anything else', () => {
    expect(readApiError(null)).toEqual({ code: '', message: '' });
    expect(readApiError('oops')).toEqual({ code: '', message: '' });
    expect(readApiError({ code: 42, message: ['x'] })).toEqual({ code: '', message: '' });
    expect(readApiError(new Error('boom'))).toEqual({ code: '', message: 'boom' });
  });
});

describe('isNetworkError', () => {
  it.each([
    'TypeError: Failed to fetch',
    'TypeError: Network request failed',
    'NetworkError when attempting to fetch resource.',
    'The request timed out',
    'Connection refused',
  ])('recognises "%s"', (message) => {
    expect(isNetworkError({ code: '', message })).toBe(true);
  });

  it('does not mistake a database answer for a network failure', () => {
    expect(isNetworkError({ code: 'P0001', message: 'store_unavailable' })).toBe(false);
    expect(isNetworkError({ code: '42501', message: 'permission denied for table orders' })).toBe(
      false,
    );
    expect(isNetworkError({ code: '', message: 'something else entirely' })).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});
