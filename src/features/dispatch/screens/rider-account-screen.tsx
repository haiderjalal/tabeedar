import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { AccountPanel } from '@/features/auth/components/account-panel';
import { NotificationNotice } from '@/features/notifications/components/notification-notice';
import { spacing } from '@/theme';

/** The rider's account tab: who is signed in, language, sign-out, and a notice if notifications are off. */
export function RiderAccountScreen() {
  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <AccountPanel />
        <NotificationNotice />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
});
