import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { OrderStatusChip } from '@/features/orders/components/order-status-chip';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, formatRupees } from '@/lib/format';
import { radius, spacing } from '@/theme';

import type { DeliveryListItem } from '../types';

interface DeliveryCardProps {
  delivery: DeliveryListItem;
  onPress: () => void;
}

/** One of the rider's deliveries in a list: store, where it goes, status, what it pays and when. */
export function DeliveryCard({ delivery, onPress }: DeliveryCardProps) {
  const { t } = useTranslation('rider');
  const { t: tOrders } = useTranslation('orders');
  const { language } = useLanguage();
  const { colors } = useTheme();

  const place = [delivery.dropoffArea, delivery.dropoffCity].filter(Boolean).join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tOrders('detail.orderNumber', { id: delivery.id })}, ${delivery.storeName}, ${t(`status.${delivery.status}`)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.top}>
        <Text style={styles.strong}>{delivery.storeName}</Text>
        <Text style={styles.strong}>{formatRupees(delivery.deliveryFee)}</Text>
      </View>
      <OrderStatusChip status={delivery.status} perspective="rider" />
      <Text variant="caption" tone="muted">
        {t('deliveries.dropoff', { place })}
      </Text>
      <Text variant="caption" tone="muted">
        {tOrders('detail.orderNumber', { id: delivery.id })} ·{' '}
        {t('deliveries.placedAt', { date: formatDateTime(delivery.createdAt, language) })}
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
  strong: {
    fontWeight: '600',
    flexShrink: 1,
  },
});
