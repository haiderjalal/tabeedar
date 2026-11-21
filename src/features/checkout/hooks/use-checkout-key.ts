import { randomUUID } from 'expo-crypto';
import { useState } from 'react';

/**
 * The idempotency key for the current checkout attempt. It stays the same while `signature` stays
 * the same (so a retry after a lost connection cannot create a second order) and is replaced as
 * soon as the signature changes (a different order gets a different key).
 */
export function useCheckoutKey(signature: string): string {
  const [current, setCurrent] = useState(() => ({ signature, key: randomUUID() }));

  if (current.signature !== signature) {
    // Adjusting state during render, as React recommends for state that follows other state.
    setCurrent({ signature, key: randomUUID() });
  }
  return current.key;
}
