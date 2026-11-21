// Makes the synchronous `localStorage` available (it is also installed by the Supabase client).
import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { onSignedOut } from '@/lib/session-events';

interface SelectedAddressState {
  /** The address the customer chose to deliver to, or null to use their default. */
  selectedAddressId: number | null;
  select: (addressId: number) => void;
  /** Forgets the choice only if it is this address (used when an address is deleted). */
  clearIf: (addressId: number) => void;
  clear: () => void;
}

/**
 * Remembers which saved address the customer is delivering to, so browsing and checkout agree and
 * the choice survives restarting the app. Whether that address still exists is checked by
 * `useSelectedAddress`.
 */
export const useSelectedAddressStore = create<SelectedAddressState>()(
  persist(
    (set, get) => ({
      selectedAddressId: null,
      select: (addressId) => set({ selectedAddressId: addressId }),
      clearIf: (addressId) => {
        if (get().selectedAddressId === addressId) set({ selectedAddressId: null });
      },
      clear: () => set({ selectedAddressId: null }),
    }),
    {
      name: 'tabeedar.selected-address',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedAddressId: state.selectedAddressId }),
      merge: (saved, current) => {
        const id = (saved as { selectedAddressId?: unknown } | null)?.selectedAddressId;
        return typeof id === 'number' && Number.isInteger(id)
          ? { ...current, selectedAddressId: id }
          : current;
      },
    },
  ),
);

onSignedOut(() => useSelectedAddressStore.getState().clear());
