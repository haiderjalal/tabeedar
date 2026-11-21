import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { useMyStore } from '@/features/shop/hooks/use-my-store';
import { useTheme } from '@/hooks/use-theme';

/**
 * Store area. A store account must set its store up before anything else: until it has one, the
 * only screen is the setup form; once it exists, the tabs and the screens that open on top of them
 * become available (and the setup form goes away). Guarded as a whole in the root navigator.
 */
export default function StoreLayout() {
  const { t } = useTranslation('navigation');
  const { t: tShop } = useTranslation('shop');
  const { colors } = useTheme();
  const store = useMyStore();

  // The navigator is not rendered until we know whether the store exists, so a deep link into the
  // area is not thrown away while the answer is still loading (same reasoning as the root navigator).
  // Checking `data` (not `isError`) keeps the area on screen if a later refresh fails.
  if (store.data === undefined) {
    return store.isError ? (
      <ErrorState message={tShop('loadError')} onRetry={() => void store.refetch()} />
    ) : (
      <LoadingState />
    );
  }
  const hasStore = store.data !== null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!hasStore}>
        <Stack.Screen name="setup-store" options={{ title: t('screens.setupStore') }} />
      </Stack.Protected>

      <Stack.Protected guard={hasStore}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="orders/[id]" options={{ title: t('screens.order') }} />
        <Stack.Screen name="edit-store" options={{ title: t('screens.editStore') }} />
        <Stack.Screen name="catalog/categories" options={{ title: t('screens.categories') }} />
        <Stack.Screen name="catalog/products/new" options={{ title: t('screens.newProduct') }} />
        <Stack.Screen name="catalog/products/[id]" options={{ title: t('screens.editProduct') }} />
      </Stack.Protected>
    </Stack>
  );
}
