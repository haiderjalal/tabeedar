import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';

/**
 * Customer area: the tabs, with the screens that open on top of them (a store, checkout, addresses,
 * an order) in a stack with a back button. Guarded in the root navigator.
 */
export default function CustomerLayout() {
  const { t } = useTranslation('navigation');
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* The store's own name is set as the title by its screen. */}
      <Stack.Screen name="stores/[id]" options={{ title: t('screens.store') }} />
      <Stack.Screen name="checkout" options={{ title: t('screens.checkout') }} />
      <Stack.Screen name="addresses/index" options={{ title: t('screens.addresses') }} />
      <Stack.Screen name="addresses/new" options={{ title: t('screens.newAddress') }} />
      <Stack.Screen name="addresses/[id]" options={{ title: t('screens.editAddress') }} />
      <Stack.Screen name="my-orders/[id]" options={{ title: t('screens.order') }} />
    </Stack>
  );
}
