import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { useMyRider } from '@/features/dispatch/hooks/use-my-rider';
import { useTheme } from '@/hooks/use-theme';

/**
 * Rider area. A rider must be approved before anything else: until then the only screen is the
 * status screen (register, wait, or suspended). Once the owner approves, the tabs and the delivery
 * screens become available and the status screen goes away. Guarded as a whole in the root navigator;
 * the database independently refuses everything to a rider who is not approved.
 */
export default function RiderLayout() {
  const { t } = useTranslation('navigation');
  const { t: tRider } = useTranslation('rider');
  const { colors } = useTheme();
  const rider = useMyRider();

  // Not rendered until we know the rider's state, so a deep link into the area is not thrown away
  // while it loads. Checking `data` (not `isError`) keeps the area on screen if a later refresh fails.
  if (rider.data === undefined) {
    return rider.isError ? (
      <ErrorState message={tRider('registration.loadError')} onRetry={() => void rider.refetch()} />
    ) : (
      <LoadingState />
    );
  }
  const isApproved = rider.data?.status === 'approved';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!isApproved}>
        <Stack.Screen
          name="rider-status"
          options={{ title: t('screens.riderAccount'), headerShown: false }}
        />
      </Stack.Protected>

      <Stack.Protected guard={isApproved}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="deliveries/[id]" options={{ title: t('screens.delivery') }} />
      </Stack.Protected>
    </Stack>
  );
}
