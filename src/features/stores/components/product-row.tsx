import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { QuantityStepper } from '@/components/quantity-stepper';
import { StatusChip } from '@/components/status-chip';
import { Text } from '@/components/text';
import { MAX_LINE_QUANTITY } from '@/features/cart/logic/cart.logic';
import { Picture } from '@/features/media/components/picture';
import { useTheme } from '@/hooks/use-theme';
import { formatRupees } from '@/lib/format';
import { spacing } from '@/theme';

import type { Product } from '../types';

const PHOTO_SIZE = 72;

interface ProductRowProps {
  product: Product;
  /** How many of this product are in the cart. */
  quantity: number;
  /** False when the store is closed: the product can be looked at but not added. */
  canOrder: boolean;
  onAdd: () => void;
  onQuantityChange: (quantity: number) => void;
}

/** A product with its price and the control to add it: an Add button, or a stepper once added. */
export function ProductRow({
  product,
  quantity,
  canOrder,
  onAdd,
  onQuantityChange,
}: ProductRowProps) {
  const { t } = useTranslation('stores');
  const { t: tCart } = useTranslation('cart');
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      {/* No placeholder when a product has no photo: a column of grey boxes is noise. */}
      {product.imagePath ? (
        <Picture path={product.imagePath} width={PHOTO_SIZE} height={PHOTO_SIZE} />
      ) : null}
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        {product.description ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}
        <Text tone="primary" style={styles.price}>
          {formatRupees(product.price)}
        </Text>
      </View>

      <View style={styles.action}>
        {!product.isAvailable ? (
          <StatusChip label={t('store.outOfStock')} tone="muted" />
        ) : !canOrder ? null : quantity > 0 ? (
          <QuantityStepper
            value={quantity}
            max={MAX_LINE_QUANTITY}
            onChange={onQuantityChange}
            decreaseLabel={tCart('decrease', { name: product.name })}
            increaseLabel={tCart('increase', { name: product.name })}
            quantityLabel={tCart('quantity', { name: product.name, count: quantity })}
          />
        ) : (
          <Button
            label={t('store.add')}
            variant="secondary"
            accessibilityLabel={t('store.addLabel', { name: product.name })}
            onPress={onAdd}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontWeight: '600',
  },
  price: {
    fontWeight: '600',
  },
  action: {
    alignItems: 'flex-end',
  },
});
