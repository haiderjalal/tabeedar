import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, formatRupees } from '@/lib/format';
import { radius, spacing } from '@/theme';

import type { OrderListItem } from '../types';

import { OrderStatusChip } from './order-status-chip';

interface OrderListCardProps {
  order: OrderListItem;
  onPress: () => void;
}

/** One order in "My orders": store, status, total and when it was placed. */
export function OrderListCard({ order, onPress }: OrderListCardProps) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('detail.orderNumber', { id: order.id })}, ${order.storeName}, ${t(`status.${order.status}`)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.top}>
        <Text style={styles.store}>{order.storeName}</Text>
        <Text style={styles.store}>{formatRupees(order.total)}</Text>
      </View>
      <OrderStatusChip status={order.status} />
      <Text variant="caption" tone="muted">
        {t('detail.orderNumber', { id: order.id })} ·{' '}
        {t('list.placedAt', { date: formatDateTime(order.createdAt, language) })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  store: {
    fontWeight: '600',
    flexShrink: 1,
  },
});
