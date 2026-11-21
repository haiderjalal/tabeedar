import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

/** Server data is considered fresh for a minute, which avoids refetching on every screen. */
const STALE_TIME_MS = 60_000;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: 1,
      },
      // Mutations (placing an order, accepting a delivery) must never be silently retried.
      mutations: { retry: 0 },
    },
  });
}

/**
 * React Native has no "window focus" event, so tell TanStack Query that the app counts as
 * focused whenever it is in the foreground. Stale data then refreshes on app resume.
 */
function useRefetchOnAppForeground(): void {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);
}

interface QueryProviderProps {
  children: ReactNode;
}

/** Provides the shared server-state cache to the whole app. */
export function QueryProvider({ children }: QueryProviderProps) {
  // `useState` keeps one client for the lifetime of the app, even across re-renders.
  const [queryClient] = useState(createQueryClient);
  useRefetchOnAppForeground();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
