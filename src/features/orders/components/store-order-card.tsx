import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, formatRupees } from '@/lib/format';
import { radius, spacing } from '@/theme';

import type { StoreOrderListItem } from '../types';

import { OrderStatusChip } from './order-status-chip';

interface StoreOrderCardProps {
  order: StoreOrderListItem;
  onPress: () => void;
}

/** One order in the store's list: who it is for, its status, the total and when it came in. */
export function StoreOrderCard({ order, onPress }: StoreOrderCardProps) {
  const { t } = useTranslation('orders');
  const { t: tStore } = useTranslation('storeOrders');
  const { language } = useLanguage();
  const { colors } = useTheme();

  // A new order stands out with a stronger border: it is the only status that needs an answer.
  const needsAnswer = order.status === 'placed';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('detail.orderNumber', { id: order.id })}, ${order.recipientName}, ${tStore(`status.${order.status}`)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: needsAnswer ? colors.primary : colors.border,
          borderWidth: needsAnswer ? 2 : 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.top}>
        <Text style={styles.strong}>
          {tStore('list.forCustomer', { name: order.recipientName })}
        </Text>
        <Text style={styles.strong}>{formatRupees(order.total)}</Text>
      </View>
      <OrderStatusChip status={order.status} perspective="store" />
      <Text variant="caption" tone="muted">
        {t('detail.orderNumber', { id: order.id })} ·{' '}
        {tStore('list.placedAt', { date: formatDateTime(order.createdAt, language) })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  strong: {
    fontWeight: '600',
    flexShrink: 1,
  },
});
