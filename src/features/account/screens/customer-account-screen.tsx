import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { AccountPanel } from '@/features/auth/components/account-panel';
import { NotificationNotice } from '@/features/notifications/components/notification-notice';
import { spacing } from '@/theme';

/** The customer's account tab: who is signed in, language, saved addresses and sign-out. */
export function CustomerAccountScreen() {
  const { t } = useTranslation('navigation');
  const router = useRouter();

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <AccountPanel />
        <NotificationNotice />
        <Button
          label={t('screens.addresses')}
          variant="secondary"
          onPress={() => router.push('/addresses')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
});
