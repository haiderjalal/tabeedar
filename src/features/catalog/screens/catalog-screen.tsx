import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SectionList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorBanner } from '@/components/error-banner';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useMyStore } from '@/features/shop/hooks/use-my-store';
import { useCatalog } from '@/features/stores/hooks/use-catalog';
import { groupCatalog } from '@/features/stores/utils/group-catalog';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

import { ProductManageRow } from '../components/product-manage-row';
import { useSetProductAvailable } from '../hooks/use-product-mutations';

/** The store owner's products, grouped by category, with the in-stock switch and the way to add more. */
export function CatalogScreen() {
  const { t } = useTranslation('catalog');
  const store = useMyStore();

  if (store.isPending) return <LoadingState />;
  if (store.isError || !store.data) {
    return <ErrorState message={t('list.loadError')} onRetry={() => void store.refetch()} />;
  }
  return <CatalogList storeId={store.data.id} />;
}

interface CatalogListProps {
  storeId: number;
}

function CatalogList({ storeId }: CatalogListProps) {
  const { t } = useTranslation('catalog');
  const { colors } = useTheme();
  const router = useRouter();
  const catalog = useCatalog(storeId);
  const setAvailable = useSetProductAvailable(storeId);

  if (catalog.isPending) return <LoadingState />;
  if (catalog.isError) {
    return <ErrorState message={t('list.loadError')} onRetry={() => void catalog.refetch()} />;
  }

  const sections = groupCatalog(catalog.data);

  return (
    <Screen edges={['top', 'left', 'right']} padded={false}>
      <SectionList
        sections={sections}
        keyExtractor={(product) => String(product.id)}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.list}
        refreshing={catalog.isRefetching}
        onRefresh={() => void catalog.refetch()}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button
              label={t('list.addProduct')}
              onPress={() => router.push('/catalog/products/new')}
            />
            <Button
              label={t('list.manageCategories')}
              variant="secondary"
              onPress={() => router.push('/catalog/categories')}
            />
            {setAvailable.isError ? <ErrorBanner message={t('list.stockFailed')} /> : null}
          </View>
        }
        renderSectionHeader={({ section }) => {
          const title = section.title ?? (sections.length > 1 ? t('list.uncategorised') : null);
          return title ? (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text variant="heading" accessibilityRole="header">
                {title}
              </Text>
            </View>
          ) : null;
        }}
        renderItem={({ item }) => (
          <ProductManageRow
            product={item}
            onEdit={() =>
              router.push({ pathname: '/catalog/products/[id]', params: { id: String(item.id) } })
            }
            onStockChange={(isAvailable) =>
              setAvailable.mutate({ productId: item.id, isAvailable })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState title={t('list.emptyTitle')} message={t('list.emptyBody')} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
  },
});
