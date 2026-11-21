import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { spacing } from '@/theme';

import { useAuth } from '../hooks/use-auth';
import { useSignOut } from '../hooks/use-sign-out';

/**
 * Shown when someone is signed in but their profile could not be loaded (usually no connection).
 * They can try again or sign out; they are never left stuck on a blank screen.
 */
export function ProfileProblemScreen() {
  const { t } = useTranslation('auth');
  const { t: tCommon } = useTranslation();
  const { retryProfile } = useAuth();
  const signOut = useSignOut();

  return (
    <Screen>
      <View style={styles.content}>
        <Text variant="title" accessibilityRole="header">
          {t('profileProblem.title')}
        </Text>
        <Text tone="muted">{t('profileProblem.body')}</Text>
        <Button label={tCommon('actions.retry')} onPress={retryProfile} />
        <Button
          label={t('account.signOut')}
          variant="secondary"
          loading={signOut.isPending}
          onPress={() => signOut.mutate()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
