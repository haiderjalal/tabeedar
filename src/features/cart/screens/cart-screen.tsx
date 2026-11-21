import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { formatRupees } from '@/lib/format';
import { spacing } from '@/theme';

import { CartLineRow } from '../components/cart-line-row';
import { useCart, useCartActions } from '../hooks/use-cart';
import { useCartView } from '../hooks/use-cart-view';

/** The cart: what the customer is about to order, with live prices and a way to check out. */
export function CartScreen() {
  const { t } = useTranslation('cart');
  const { t: tCommon } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const cart = useCart();
  const { view } = useCartView();
  const { setQuantity, remove, clear } = useCartActions();
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  if (cart.lines.length === 0) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <EmptyState
          title={t('emptyTitle')}
          message={t('emptyBody')}
          action={{ label: t('browse'), onPress: () => router.navigate('/home') }}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']} padded={false}>
      <FlatList
        data={view.lines}
        keyExtractor={(line) => String(line.productId)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text variant="heading" accessibilityRole="header" style={styles.heading}>
            {t('from', { store: cart.storeName ?? '' })}
          </Text>
        }
        renderItem={({ item }) => (
          <CartLineRow
            line={item}
            onQuantityChange={(quantity) => setQuantity(item.productId, quantity)}
            onRemove={() => remove(item.productId)}
          />
        )}
        ListFooterComponent={
          <Button label={t('clear')} variant="ghost" onPress={() => setIsConfirmingClear(true)} />
        }
      />

      <View
        style={[
          styles.footer,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>{t('subtotal')}</Text>
          <Text style={styles.subtotalLabel}>{formatRupees(view.subtotal)}</Text>
        </View>
        <Text variant="caption" tone="muted">
          {t('deliveryNote')}
        </Text>
        <Button
          label={t('checkout')}
          disabled={!view.canCheckout}
          onPress={() => router.push('/checkout')}
        />
      </View>

      <ConfirmDialog
        visible={isConfirmingClear}
        title={t('clearConfirm.title')}
        message={t('clearConfirm.body')}
        confirmLabel={t('clearConfirm.confirm')}
        cancelLabel={tCommon('actions.cancel')}
        destructive
        onConfirm={() => {
          clear();
          setIsConfirmingClear(false);
        }}
        onCancel={() => setIsConfirmingClear(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heading: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  footer: {
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtotalLabel: {
    fontWeight: '600',
  },
});
