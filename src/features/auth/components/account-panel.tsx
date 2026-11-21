import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Text } from '@/components/text';
import { spacing } from '@/theme';

import { useAuth } from '../hooks/use-auth';
import { useSignOut } from '../hooks/use-sign-out';
import { toAuthErrorKey } from '../utils/auth-error';

/**
 * Who is signed in, which language is on, and the sign-out button. Every role's home screen shows
 * it for now; it will move into a settings screen once the real home screens exist.
 */
export function AccountPanel() {
  const { t } = useTranslation('auth');
  const { profile, user } = useAuth();
  const signOut = useSignOut();

  const name = profile?.fullName ?? user?.email ?? '';

  return (
    <View style={styles.panel}>
      <Text variant="title">{t('account.greeting', { name })}</Text>
      {profile ? (
        <Text tone="muted">
          {t('account.roleLabel')}: {t(`account.role.${profile.role}`)}
        </Text>
      ) : null}
      <LanguageSwitcher />
      {signOut.isError ? (
        <ErrorBanner message={t(`errors.${toAuthErrorKey(signOut.error)}`)} />
      ) : null}
      <Button
        label={t('account.signOut')}
        variant="secondary"
        loading={signOut.isPending}
        onPress={() => signOut.mutate()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.lg,
  },
});
