import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { useMyStore } from '@/features/shop/hooks/use-my-store';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

import { StoreOrderCard } from '../components/store-order-card';
import { useStoreOrders } from '../hooks/use-store-orders';
import type { StoreOrderTab } from '../services/store-orders.service';

const TABS: readonly StoreOrderTab[] = ['active', 'history'];

/** The orders a store has received: the ones that need work, and the finished ones. */
export function StoreOrdersScreen() {
  const { t } = useTranslation('storeOrders');
  const store = useMyStore();

  if (store.isPending) return <LoadingState />;
  if (store.isError || !store.data) {
    return <ErrorState message={t('list.loadError')} onRetry={() => void store.refetch()} />;
  }
  return <StoreOrdersList storeId={store.data.id} />;
}

interface StoreOrdersListProps {
  storeId: number;
}

function StoreOrdersList({ storeId }: StoreOrdersListProps) {
  const { t } = useTranslation('storeOrders');
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<StoreOrderTab>('active');
  const orders = useStoreOrders(storeId, tab);

  return (
    <Screen edges={['top', 'left', 'right']} padded={false}>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {TABS.map((name) => (
          <View key={name} style={styles.tab}>
            <Button
              label={t(`tabs.${name}`)}
              variant={tab === name ? 'primary' : 'secondary'}
              selected={tab === name}
              onPress={() => setTab(name)}
            />
          </View>
        ))}
      </View>

      {orders.isPending ? (
        <LoadingState />
      ) : orders.isError ? (
        <ErrorState message={t('list.loadError')} onRetry={() => void orders.refetch()} />
      ) : (
        <FlatList
          data={orders.data.pages.flat()}
          keyExtractor={(order) => String(order.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => (
            <StoreOrderCard
              order={item}
              onPress={() =>
                router.push({ pathname: '/orders/[id]', params: { id: String(item.id) } })
              }
            />
          )}
          refreshing={orders.isRefetching && !orders.isFetchingNextPage}
          onRefresh={() => void orders.refetch()}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (orders.hasNextPage && !orders.isFetchingNextPage) void orders.fetchNextPage();
          }}
          ListEmptyComponent={
            tab === 'active' ? (
              <EmptyState title={t('list.emptyActiveTitle')} message={t('list.emptyActiveBody')} />
            ) : (
              <EmptyState
                title={t('list.emptyHistoryTitle')}
                message={t('list.emptyHistoryBody')}
              />
            )
          }
          ListFooterComponent={
            orders.isFetchingNextPage ? (
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
