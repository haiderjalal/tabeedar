import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorBanner } from '@/components/error-banner';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

import { OfferCard } from '../components/offer-card';
import { useDeliveries } from '../hooks/use-deliveries';
import { useAcceptDelivery, useOffers } from '../hooks/use-offers';
import { usePresenceSwitch } from '../hooks/use-presence';
import { toDispatchErrorKey } from '../utils/dispatch-error';

/** The rider's home: the online switch, and the deliveries near them that they can accept. */
export function OffersScreen() {
  const { t } = useTranslation('rider');
  const { colors } = useTheme();
  const router = useRouter();
  const presence = usePresenceSwitch();
  const offers = useOffers(presence.isOnline);
  const accept = useAcceptDelivery();
  // A rider holds one delivery at a time (database rule), so the first active one is "the" one.
  const active = useDeliveries('active');
  const current = active.data?.pages[0]?.[0] ?? null;

  function openDelivery(orderId: number): void {
    router.push({ pathname: '/deliveries/[id]', params: { id: String(orderId) } });
  }

  const visibleOffers = presence.isOnline && current === null ? (offers.data ?? []) : [];

  return (
    <Screen edges={['top', 'left', 'right']} padded={false}>
      <FlatList
        data={visibleOffers}
        keyExtractor={(offer) => String(offer.orderId)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        refreshing={offers.isRefetching}
        onRefresh={() => {
          // Pulling to refresh also dismisses an old "another rider took it" message.
          accept.reset();
          void offers.refetch();
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t('presence.label')}</Text>
                <Switch
                  accessibilityLabel={t('presence.label')}
                  value={presence.isOnline}
                  // Disabled while the position is read or the change is saved: no double taps.
                  disabled={presence.isBusy}
                  onValueChange={(next) => void presence.setOnline(next)}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
              </View>
              <Text variant="caption" tone="muted">
                {t('presence.hint')}
              </Text>
              {presence.locationProblem ? (
                <Text variant="caption" tone="danger" accessibilityRole="alert">
                  {t(
                    presence.locationProblem === 'denied'
                      ? 'presence.denied'
                      : 'presence.unavailable',
                  )}
                </Text>
              ) : null}
              {presence.error ? (
                <ErrorBanner message={t(`errors.${toDispatchErrorKey(presence.error)}`)} />
              ) : null}
            </View>

            {current ? (
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.primary },
                ]}
              >
                <Text style={styles.strong}>{t('offers.busyTitle')}</Text>
                <Text tone="muted">{t('offers.busyBody')}</Text>
                <Button label={t('offers.busyAction')} onPress={() => openDelivery(current.id)} />
              </View>
            ) : null}

            {accept.isError ? (
              <ErrorBanner message={t(`errors.${toDispatchErrorKey(accept.error)}`)} />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <OfferCard
            offer={item}
            isAccepting={accept.isPending && accept.variables === item.orderId}
            isBusy={accept.isPending}
            onAccept={() =>
              accept.mutate(item.orderId, { onSuccess: () => openDelivery(item.orderId) })
            }
          />
        )}
        ListEmptyComponent={
          current ? undefined : !presence.isOnline ? (
            <EmptyState title={t('offers.offlineTitle')} message={t('offers.offlineBody')} />
          ) : offers.isPending ? (
            <LoadingState />
          ) : offers.isError ? (
            <ErrorState message={t('offers.loadError')} onRetry={() => void offers.refetch()} />
          ) : (
            <EmptyState title={t('offers.emptyTitle')} message={t('offers.emptyBody')} />
          )
        }
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
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
  strong: {
    fontWeight: '600',
  },
  separator: {
    height: spacing.md,
  },
});
