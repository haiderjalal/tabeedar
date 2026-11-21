import { describe, expect, it } from 'vitest';

import { unusedPaths } from './unused-paths';

describe('unusedPaths', () => {
  it('returns pictures that were replaced', () => {
    expect(
      unusedPaths(
        ['stores/1/logo/a.jpg', 'stores/1/cover/b.jpg'],
        ['stores/1/logo/c.jpg', 'stores/1/cover/b.jpg'],
      ),
    ).toEqual(['stores/1/logo/a.jpg']);
  });

  it('returns a picture that was removed', () => {
    expect(unusedPaths(['stores/1/logo/a.jpg'], [null])).toEqual(['stores/1/logo/a.jpg']);
  });

  it('ignores missing pictures and unchanged ones', () => {
    expect(unusedPaths([null, 'stores/1/logo/a.jpg'], [null, 'stores/1/logo/a.jpg'])).toEqual([]);
  });

  it('keeps a picture that moved to another slot', () => {
    expect(unusedPaths(['stores/1/logo/a.jpg', null], [null, 'stores/1/logo/a.jpg'])).toEqual([]);
  });
});
