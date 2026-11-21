export interface Debounced {
  (): void;
  /** Drops a call that is still waiting. */
  cancel: () => void;
}

/**
 * Turns a burst of calls into one call after things go quiet for `waitMs`. Used to refresh data once
 * when several database changes arrive together (accepting an order touches several rows).
 */
export function debounce(callback: () => void, waitMs: number): Debounced {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      callback();
    }, waitMs);
  };
  debounced.cancel = (): void => {
    clearTimeout(timer);
    timer = undefined;
  };
  return debounced;
}
