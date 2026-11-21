import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { formatRupees } from '@/lib/format';
import { spacing } from '@/theme';

import type { CartLineView } from '../logic/cart-view';
import { MAX_LINE_QUANTITY } from '../logic/cart.logic';

interface CartLineRowProps {
  line: CartLineView;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

/** One item in the cart: name, price, warnings about price or stock, and the quantity control. */
export function CartLineRow({ line, onQuantityChange, onRemove }: CartLineRowProps) {
  const { t } = useTranslation('cart');
  const { t: tCommon } = useTranslation();
  const { colors } = useTheme();

  // Whole paisa first, so the line total never shows floating point noise.
  const lineTotal = (Math.round(line.currentPrice * 100) * line.quantity) / 100;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.info}>
        <Text style={styles.name}>{line.name}</Text>
        <Text variant="caption" tone="muted">
          {formatRupees(line.currentPrice)}
        </Text>
        {line.isUnavailable ? (
          <Text variant="caption" tone="danger" accessibilityRole="alert">
            {t('unavailable')}
          </Text>
        ) : line.priceChanged ? (
          <Text variant="caption" tone="danger">
            {t('priceChanged', { price: formatRupees(line.currentPrice) })}
          </Text>
        ) : null}
      </View>

      <View style={styles.controls}>
        {line.isUnavailable ? (
          <Button label={tCommon('actions.delete')} variant="secondary" onPress={onRemove} />
        ) : (
          <>
            <QuantityStepper
              value={line.quantity}
              max={MAX_LINE_QUANTITY}
              onChange={onQuantityChange}
              decreaseLabel={t('decrease', { name: line.name })}
              increaseLabel={t('increase', { name: line.name })}
              quantityLabel={t('quantity', { name: line.name, count: line.quantity })}
            />
            <Text style={styles.total}>{formatRupees(lineTotal)}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    gap: spacing.xs,
  },
  name: {
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  total: {
    fontWeight: '600',
  },
});
