import { describe, expect, it } from 'vitest';

import { readProjectId } from './project-id';

describe('readProjectId', () => {
  it('reads the id written by `eas init`', () => {
    expect(readProjectId({ eas: { projectId: '1234-abcd' } })).toBe('1234-abcd');
  });

  it.each([
    undefined,
    null,
    'x',
    {},
    { eas: null },
    { eas: {} },
    { eas: { projectId: '' } },
    { eas: { projectId: 5 } },
  ])('gives null when it is not set up: %j', (extra) => {
    expect(readProjectId(extra)).toBeNull();
  });
});
