import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useAuth } from '../hooks/use-auth';

// Keep the splash screen up until we know whether someone is signed in, so signed-in users
// never see a flash of the sign-in screen.
void SplashScreen.preventAutoHideAsync();

/**
 * The app's single navigator. Each group of screens is guarded: Expo Router refuses to show a
 * guarded screen unless its condition is true, and moves the person to the entry route (which
 * redirects them to the right place) the moment a condition stops being true, for example on
 * sign-out. This is the UI side of access control; the database enforces the real rules.
 */
export function AppNavigator() {
  const { status, role } = useAuth();

  // True once we have known the sign-in state at least once. Until then the navigator is not
  // rendered at all. That matters for deep links: if the navigator existed while the saved session
  // was still loading, every guard would be false and Expo Router would throw away the address the
  // app was opened with (an order notification, a confirmation link) and go to the entry route.
  const [hasResolved, setHasResolved] = useState(false);
  if (!hasResolved && status !== 'loading') {
    // Set during render on purpose (React's pattern for state that follows other state); it only
    // ever flips once, from false to true.
    setHasResolved(true);
  }

  useEffect(() => {
    // The only effect: tell the native splash screen it can go away.
    if (hasResolved) {
      SplashScreen.hide();
    }
  }, [hasResolved]);

  if (!hasResolved) return null;

  const isReady = status === 'ready';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Also open while the profile of a person who has just signed in is loading, so the form
          stays on screen until we know which area to send them to. */}
      <Stack.Protected guard={status === 'signedOut' || status === 'loading'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isReady && role === 'customer'}>
        <Stack.Screen name="(customer)" />
      </Stack.Protected>

      <Stack.Protected guard={isReady && role === 'store'}>
        <Stack.Screen name="(store)" />
      </Stack.Protected>

      <Stack.Protected guard={isReady && role === 'rider'}>
        <Stack.Screen name="(rider)" />
      </Stack.Protected>

      <Stack.Protected guard={status === 'error'}>
        <Stack.Screen name="account-problem" />
      </Stack.Protected>
    </Stack>
  );
}
