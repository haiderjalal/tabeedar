import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { StatusChip } from '@/components/status-chip';
import { Text } from '@/components/text';
import { useCart, useCartActions } from '@/features/cart/hooks/use-cart';
import { cartItemCount, cartSubtotal } from '@/features/cart/logic/cart.logic';
import { Picture } from '@/features/media/components/picture';
import { publicImageUrl } from '@/features/media/services/media.service';
import { useTheme } from '@/hooks/use-theme';
import { formatRupees } from '@/lib/format';
import { radius, spacing } from '@/theme';

import { ProductRow } from '../components/product-row';
import { useCatalog } from '../hooks/use-catalog';
import { useStore } from '../hooks/use-store';
import type { Product, StoreDetails } from '../types';
import { groupCatalog } from '../utils/group-catalog';

const COVER_HEIGHT = 150;

interface StoreScreenProps {
  storeId: number;
}

/** A store's page: its details and products by category, with adding to the cart. */
export function StoreScreen({ storeId }: StoreScreenProps) {
  const { t } = useTranslation('stores');
  const { t: tCart } = useTranslation('cart');
  const { t: tCommon } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const store = useStore(storeId);
  const catalog = useCatalog(storeId);
  const cart = useCart();
  const { add, startNew, setQuantity } = useCartActions();
  // A product the customer tried to add while their cart belongs to another store.
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  if (store.isPending || catalog.isPending) return <LoadingState />;
  if (store.isError || catalog.isError) {
    return (
      <ErrorState
        message={t('store.loadError')}
        onRetry={() => {
          void store.refetch();
          void catalog.refetch();
        }}
      />
    );
  }
  if (!store.data) return <StoreNotFound />;

  const details: StoreDetails = store.data;
  const sections = groupCatalog(catalog.data);
  const cartIsHere = cart.storeId === storeId;
  const itemCount = cartIsHere ? cartItemCount(cart) : 0;

  function addProduct(product: Product): void {
    const result = add({ id: details.id, name: details.name }, product);
    if (result === 'other-store') setPendingProduct(product);
  }

  return (
    <Screen edges={['bottom', 'left', 'right']} padded={false}>
      <Stack.Screen options={{ title: details.name }} />

      <SectionList
        sections={sections}
        keyExtractor={(product) => String(product.id)}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.storeHeader}>
            {details.coverPath ? (
              <Picture path={details.coverPath} width="100%" height={COVER_HEIGHT} />
            ) : null}
            <View style={styles.storeTitleRow}>
              <Avatar name={details.name} uri={publicImageUrl(details.logoPath)} />
              <View style={styles.storeInfo}>
                <Text variant="heading" accessibilityRole="header">
                  {details.name}
                </Text>
                <Text variant="caption" tone="muted">
                  {[details.area, details.city].filter(Boolean).join(', ')}
                </Text>
                <StatusChip
                  label={details.isOpen ? t('card.open') : t('card.closed')}
                  tone={details.isOpen ? 'success' : 'muted'}
                />
              </View>
            </View>
            {details.description ? <Text tone="muted">{details.description}</Text> : null}
            {!details.isOpen ? (
              <View
                accessibilityRole="alert"
                style={[
                  styles.banner,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
              >
                <Text>{t('store.closedBanner')}</Text>
              </View>
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => {
          const title = section.title ?? (sections.length > 1 ? t('store.otherItems') : null);
          return title ? (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text variant="heading" accessibilityRole="header">
                {title}
              </Text>
            </View>
          ) : null;
        }}
        renderItem={({ item }) => {
          const line = cart.lines.find((candidate) => candidate.productId === item.id);
          const quantity = cartIsHere && line ? line.quantity : 0;
          return (
            <View style={styles.productWrapper}>
              <ProductRow
                product={item}
                quantity={quantity}
                canOrder={details.isOpen}
                onAdd={() => addProduct(item)}
                onQuantityChange={(next) => setQuantity(item.id, next)}
              />
            </View>
          );
        }}
        ListEmptyComponent={<EmptyState title={t('store.noProducts')} message="" />}
      />

      {itemCount > 0 ? (
        <View
          style={[
            styles.cartBar,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <Button
            label={`${t('store.viewCart')} · ${t('store.cartSummary', { count: itemCount })} · ${formatRupees(cartSubtotal(cart))}`}
            onPress={() => router.navigate('/cart')}
          />
        </View>
      ) : null}

      <ConfirmDialog
        visible={pendingProduct !== null}
        title={tCart('replace.title')}
        message={tCart('replace.body', { store: cart.storeName ?? '' })}
        confirmLabel={tCart('replace.confirm')}
        cancelLabel={tCommon('actions.cancel')}
        destructive
        onConfirm={() => {
          if (pendingProduct) startNew({ id: details.id, name: details.name }, pendingProduct);
          setPendingProduct(null);
        }}
        onCancel={() => setPendingProduct(null)}
      />
    </Screen>
  );
}

/** Shown for a store that does not exist, is suspended, or whose address could not be read. */
export function StoreNotFound() {
  const { t } = useTranslation('stores');
  return <EmptyState title={t('store.notFoundTitle')} message={t('store.notFoundBody')} />;
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  storeHeader: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  storeTitleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  storeInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  banner: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
  },
  productWrapper: {
    // Rows draw their own bottom border; this keeps them aligned with the section header.
  },
  cartBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
});
