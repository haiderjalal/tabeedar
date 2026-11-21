import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it has stopped changing for `delayMs`. Used for search boxes, so the
 * server is asked once when someone pauses typing instead of once per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
