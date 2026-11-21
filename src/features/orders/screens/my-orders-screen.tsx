import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

import { OrderListCard } from '../components/order-list-card';
import { useMyOrders } from '../hooks/use-my-orders';

/** The customer's orders, newest first, loading more as they scroll. */
export function MyOrdersScreen() {
  const { t } = useTranslation('orders');
  const { colors } = useTheme();
  const router = useRouter();
  const orders = useMyOrders();

  if (orders.isPending) return <LoadingState />;
  if (orders.isError) {
    return <ErrorState message={t('list.loadError')} onRetry={() => void orders.refetch()} />;
  }

  return (
    <Screen edges={['top', 'left', 'right']} padded={false}>
      <FlatList
        data={orders.data.pages.flat()}
        keyExtractor={(order) => String(order.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <OrderListCard
            order={item}
            onPress={() =>
              router.push({ pathname: '/my-orders/[id]', params: { id: String(item.id) } })
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
          <EmptyState
            title={t('list.emptyTitle')}
            message={t('list.emptyBody')}
            action={{ label: t('list.browse'), onPress: () => router.navigate('/home') }}
          />
        }
        ListFooterComponent={
          orders.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : undefined
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
  separator: {
    height: spacing.md,
  },
  footer: {
    padding: spacing.lg,
  },
});
