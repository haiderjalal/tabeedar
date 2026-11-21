import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

import { useNotificationPermission } from '../hooks/use-notification-permission';

/**
 * A short notice on the account screens, shown only when the phone has notifications switched off
 * for the app: without them nobody hears about new orders or deliveries while the app is closed.
 * Nothing is shown when they are on, when the question has not been asked yet, or on the web.
 */
export function NotificationNotice() {
  const { t } = useTranslation('notifications');
  const { colors } = useTheme();
  const permission = useNotificationPermission();

  if (permission !== 'denied') return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('off.title')}
      </Text>
      <Text tone="muted">{t('off.body')}</Text>
      <Button
        label={t('off.action')}
        variant="secondary"
        onPress={() => void Linking.openSettings()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontWeight: '600',
  },
});
