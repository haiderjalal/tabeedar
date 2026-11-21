import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { usePresenceHeartbeat } from '@/features/dispatch/hooks/use-presence';
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

/** The three rider tabs: offers, deliveries and account. */
export default function RiderTabsLayout() {
  const { t } = useTranslation('navigation');
  const { colors } = useTheme();
  // Lives here (not on one screen) so an online rider keeps reporting their position whichever tab
  // is open. It only runs while the app is open (decided with the owner).
  usePresenceHeartbeat();

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
        name="offers"
        options={{
          title: t('tabs.offers'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="navigate-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="deliveries"
        options={{
          title: t('tabs.deliveries'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="bicycle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="rider-account"
        options={{
          title: t('tabs.account'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
