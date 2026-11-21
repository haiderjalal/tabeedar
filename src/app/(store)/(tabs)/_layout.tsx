import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { useNewOrderCount } from '@/features/orders/hooks/use-store-orders';
import { useMyStore } from '@/features/shop/hooks/use-my-store';
import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  name: IconName;
  color: ColorValue;
  size: number;
}

function TabIcon({ name, color, size }: TabIconProps) {
  // Our tab colours are plain strings from the theme. The check narrows the tab bar's wider type.
  return <Ionicons name={name} color={typeof color === 'string' ? color : undefined} size={size} />;
}

/** The three store tabs: orders (with a count of the ones waiting), products, and the store itself. */
export default function StoreTabsLayout() {
  const { t } = useTranslation('navigation');
  const { colors } = useTheme();
  const store = useMyStore();
  const newOrders = useNewOrderCount(store.data?.id ?? null);
  const waiting = newOrders.data ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabs.orders'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="receipt-outline" color={color} size={size} />
          ),
          tabBarBadge: waiting > 0 ? waiting : undefined,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: t('tabs.catalog'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="pricetags-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-store"
        options={{
          title: t('tabs.myStore'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="storefront-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
