import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components/text';
import { Picture } from '@/features/media/components/picture';
import type { Product } from '@/features/stores/types';
import { useTheme } from '@/hooks/use-theme';
import { formatRupees } from '@/lib/format';
import { spacing } from '@/theme';

interface ProductManageRowProps {
  product: Product;
  onEdit: () => void;
  onStockChange: (isAvailable: boolean) => void;
}

const PHOTO_SIZE = 56;

/**
 * A product in the store owner's list: photo, name, price, and the in-stock switch. The switch sits
 * outside the tappable area, so flipping it never opens the editor by accident.
 */
export function ProductManageRow({ product, onEdit, onStockChange }: ProductManageRowProps) {
  const { t } = useTranslation('catalog');
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('list.editProduct', { name: product.name })}
        onPress={onEdit}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Picture path={product.imagePath} width={PHOTO_SIZE} height={PHOTO_SIZE} />
        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text tone="primary" style={styles.name}>
            {formatRupees(product.price)}
          </Text>
          <Text variant="caption" tone={product.isAvailable ? 'muted' : 'danger'}>
            {product.isAvailable ? t('list.inStock') : t('list.outOfStock')}
          </Text>
        </View>
      </Pressable>

      <Switch
        accessibilityLabel={t('list.stockSwitch', { name: product.name })}
        value={product.isAvailable}
        onValueChange={onStockChange}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
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
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontWeight: '600',
  },
});
