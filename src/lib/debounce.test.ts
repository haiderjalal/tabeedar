import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls once, after the burst has gone quiet', () => {
    const callback = vi.fn();
    const refresh = debounce(callback, 400);

    refresh();
    vi.advanceTimersByTime(300);
    refresh();
    vi.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('can be used again afterwards', () => {
    const callback = vi.fn();
    const refresh = debounce(callback, 100);

    refresh();
    vi.advanceTimersByTime(100);
    refresh();
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('drops a waiting call when cancelled', () => {
    const callback = vi.fn();
    const refresh = debounce(callback, 100);

    refresh();
    refresh.cancel();
    vi.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
  });
});
