import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { AccountPanel } from '@/features/auth/components/account-panel';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

import { useMyRider, useRegisterRider } from '../hooks/use-my-rider';

/**
 * Everything a rider sees before they are approved: the registration request, the wait for the
 * owner's decision, or a suspension. Once approved, the layout swaps this screen for the tabs.
 */
export function RiderStatusScreen() {
  const { t } = useTranslation('rider');
  const { colors } = useTheme();
  const { profile } = useAuth();
  const rider = useMyRider();
  const register = useRegisterRider();

  if (rider.isPending) return <LoadingState />;
  if (rider.isError) {
    return (
      <ErrorState message={t('registration.loadError')} onRetry={() => void rider.refetch()} />
    );
  }

  const account = rider.data;
  const name = profile?.fullName ?? '';
  const phone = profile?.phone ?? '';

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {account === null ? (
            <>
              <Text variant="heading" accessibilityRole="header">
                {t('registration.title')}
              </Text>
              <Text tone="muted">{t('registration.body')}</Text>
              {register.isError ? <ErrorBanner message={t('registration.failed')} /> : null}
              <Button
                label={t('registration.request')}
                loading={register.isPending}
                onPress={() => register.mutate()}
              />
            </>
          ) : account.status === 'suspended' ? (
            <>
              <Text variant="heading" tone="danger" accessibilityRole="header">
                {t('registration.suspendedTitle')}
              </Text>
              <Text tone="muted">{t('registration.suspendedBody')}</Text>
            </>
          ) : (
            <>
              <Text variant="heading" accessibilityRole="header">
                {t('registration.pendingTitle')}
              </Text>
              <Text tone="muted">{t('registration.pendingBody')}</Text>
              <Text variant="caption" tone="muted">
                {t('registration.submitted', { name, phone })}
              </Text>
            </>
          )}
        </View>

        <AccountPanel />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
