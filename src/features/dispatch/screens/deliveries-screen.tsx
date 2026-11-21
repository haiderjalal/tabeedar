import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

import { DeliveryCard } from '../components/delivery-card';
import { useDeliveries } from '../hooks/use-deliveries';
import type { DeliveryTab } from '../services/dispatch.service';

const TABS: readonly DeliveryTab[] = ['active', 'history'];

/** The rider's own deliveries: the one in progress, and the finished ones. */
export function DeliveriesScreen() {
  const { t } = useTranslation('rider');
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<DeliveryTab>('active');
  const deliveries = useDeliveries(tab);

  return (
    <Screen edges={['top', 'left', 'right']} padded={false}>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {TABS.map((name) => (
          <View key={name} style={styles.tab}>
            <Button
              label={t(`deliveries.tabs.${name}`)}
              variant={tab === name ? 'primary' : 'secondary'}
              selected={tab === name}
              onPress={() => setTab(name)}
            />
          </View>
        ))}
      </View>

      {deliveries.isPending ? (
        <LoadingState />
      ) : deliveries.isError ? (
        <ErrorState message={t('deliveries.loadError')} onRetry={() => void deliveries.refetch()} />
      ) : (
        <FlatList
          data={deliveries.data.pages.flat()}
          keyExtractor={(delivery) => String(delivery.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => (
            <DeliveryCard
              delivery={item}
              onPress={() =>
                router.push({ pathname: '/deliveries/[id]', params: { id: String(item.id) } })
              }
            />
          )}
          refreshing={deliveries.isRefetching && !deliveries.isFetchingNextPage}
          onRefresh={() => void deliveries.refetch()}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (deliveries.hasNextPage && !deliveries.isFetchingNextPage) {
              void deliveries.fetchNextPage();
            }
          }}
          ListEmptyComponent={
            tab === 'active' ? (
              <EmptyState
                title={t('deliveries.emptyActiveTitle')}
                message={t('deliveries.emptyActiveBody')}
              />
            ) : (
              <EmptyState
                title={t('deliveries.emptyHistoryTitle')}
                message={t('deliveries.emptyHistoryBody')}
              />
            )
          }
          ListFooterComponent={
            deliveries.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={styles.footer} />
            ) : undefined
          }
        />
      )}
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    padding: spacing.lg,
  },
});
