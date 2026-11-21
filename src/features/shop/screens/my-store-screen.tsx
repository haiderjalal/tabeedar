import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { StatusChip } from '@/components/status-chip';
import { Text } from '@/components/text';
import { AccountPanel } from '@/features/auth/components/account-panel';
import { Picture } from '@/features/media/components/picture';
import { publicImageUrl } from '@/features/media/services/media.service';
import { NotificationNotice } from '@/features/notifications/components/notification-notice';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

import { useMyStore, useSetStoreOpen } from '../hooks/use-my-store';
import { toShopErrorKey } from '../utils/shop-error';

const COVER_HEIGHT = 140;

/** The store's own tab: how it looks to customers, the open/closed switch, editing, and the account. */
export function MyStoreScreen() {
  const { t } = useTranslation('shop');
  const { colors } = useTheme();
  const router = useRouter();
  const store = useMyStore();
  const setOpen = useSetStoreOpen();

  if (store.isPending) return <LoadingState />;
  if (store.isError || !store.data) {
    return <ErrorState message={t('loadError')} onRetry={() => void store.refetch()} />;
  }

  const details = store.data;
  const place = [details.area, details.city].filter(Boolean).join(', ');

  return (
    <Screen edges={['top', 'left', 'right']} padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        {details.status === 'suspended' ? (
          <View
            accessibilityRole="alert"
            style={[styles.card, { borderColor: colors.danger, backgroundColor: colors.surface }]}
          >
            <Text tone="danger" style={styles.strong}>
              {t('my.suspendedTitle')}
            </Text>
            <Text>{t('my.suspendedBody')}</Text>
          </View>
        ) : null}

        {details.coverPath ? (
          <Picture path={details.coverPath} width="100%" height={COVER_HEIGHT} />
        ) : null}

        <View style={styles.titleRow}>
          <Avatar name={details.name} uri={publicImageUrl(details.logoPath)} />
          <View style={styles.titleText}>
            <Text variant="heading" accessibilityRole="header">
              {details.name}
            </Text>
            <Text variant="caption" tone="muted">
              {place}
            </Text>
            <StatusChip
              label={details.isOpen ? t('my.open') : t('my.closed')}
              tone={details.isOpen ? 'success' : 'muted'}
            />
          </View>
        </View>
        {details.description ? <Text tone="muted">{details.description}</Text> : null}

        <View
          style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('my.openLabel')}</Text>
            <Switch
              accessibilityLabel={t('my.openLabel')}
              value={details.isOpen}
              // Disabled while saving, so a double tap cannot send two opposite requests.
              disabled={setOpen.isPending}
              onValueChange={(isOpen) => setOpen.mutate({ storeId: details.id, isOpen })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          <Text variant="caption" tone="muted">
            {t('my.openHint')}
          </Text>
          {setOpen.isError ? (
            <ErrorBanner message={t(`errors.${toShopErrorKey(setOpen.error)}`)} />
          ) : null}
        </View>

        <Button
          label={t('my.edit')}
          variant="secondary"
          onPress={() => router.push('/edit-store')}
        />

        <AccountPanel />
        <NotificationNotice />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleText: {
    flex: 1,
    gap: spacing.xs,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  strong: {
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  switchLabel: {
    flex: 1,
    fontWeight: '600',
  },
});
