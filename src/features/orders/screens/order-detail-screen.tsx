import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { ErrorBanner } from '@/components/error-banner';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, formatRupees } from '@/lib/format';
import { radius, spacing } from '@/theme';

import { OrderStatusChip } from '../components/order-status-chip';
import { OrderTimeline } from '../components/order-timeline';
import { useCancelOrder } from '../hooks/use-cancel-order';
import { useOrderDetail } from '../hooks/use-order-detail';
import { toOrderErrorKey } from '../utils/order-error';
import { canCustomerCancel } from '../utils/order-status';

interface OrderDetailScreenProps {
  orderId: number;
}

/** One order: where it is now, what was ordered, what it costs, who is delivering it, and its history. */
export function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const detail = useOrderDetail(orderId);
  const cancel = useCancelOrder();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  if (detail.isPending) return <LoadingState />;
  if (detail.isError) {
    return <ErrorState message={t('detail.loadError')} onRetry={() => void detail.refetch()} />;
  }
  if (!detail.data) {
    return <EmptyState title={t('detail.notFoundTitle')} message={t('detail.notFoundBody')} />;
  }

  const { order, items, events, rider } = detail.data;
  const place = [order.area, order.city].filter(Boolean).join(', ');

  return (
    <Screen edges={['bottom', 'left', 'right']} padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="heading" accessibilityRole="header">
            {t('detail.from', { store: order.storeName })}
          </Text>
          <OrderStatusChip status={order.status} />
          <Text variant="caption" tone="muted">
            {t('detail.orderNumber', { id: order.id })} ·{' '}
            {t('detail.placedAt', { date: formatDateTime(order.createdAt, language) })}
          </Text>
        </View>

        {rider ? (
          <Card title={t('detail.rider')}>
            <Text>{rider.name ?? t('detail.riderUnknown')}</Text>
            {rider.phone ? (
              <Button
                label={rider.phone}
                variant="secondary"
                onPress={() => void Linking.openURL(`tel:${rider.phone}`)}
              />
            ) : null}
          </Card>
        ) : null}

        <Card title={t('detail.items')}>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.flex}>
                {t('detail.itemLine', { quantity: item.quantity, name: item.productName })}
              </Text>
              <Text>{formatRupees(item.lineTotal)}</Text>
            </View>
          ))}
          <Divider />
          <Row label={t('detail.subtotal')} value={formatRupees(order.subtotal)} />
          <Row label={t('detail.deliveryFee')} value={formatRupees(order.deliveryFee)} />
          <Row label={t('detail.total')} value={formatRupees(order.total)} strong />
          <Text variant="caption" tone="muted">
            {t('detail.cashOnDelivery')}
          </Text>
        </Card>

        <Card title={t('detail.delivery')}>
          <Text style={styles.strong}>{t('detail.recipient', { name: order.recipientName })}</Text>
          <Text>{order.addressLine}</Text>
          <Text variant="caption" tone="muted">
            {place}
          </Text>
          {order.instructions ? (
            <Text variant="caption" tone="muted">
              {order.instructions}
            </Text>
          ) : null}
          {order.notes ? (
            <Text variant="caption">
              {t('detail.notes')}: {order.notes}
            </Text>
          ) : null}
        </Card>

        <Card title={t('detail.progress')}>
          <OrderTimeline events={events} />
        </Card>

        {cancel.isError ? (
          <ErrorBanner message={t(`errors.${toOrderErrorKey(cancel.error)}`)} />
        ) : null}

        {canCustomerCancel(order.status) && !cancel.isSuccess ? (
          <Button
            label={t('detail.cancel')}
            variant="danger"
            onPress={() => setIsConfirmingCancel(true)}
          />
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={isConfirmingCancel}
        title={t('detail.cancelConfirm.title')}
        message={t('detail.cancelConfirm.body')}
        confirmLabel={t('detail.cancelConfirm.confirm')}
        cancelLabel={t('detail.cancelConfirm.keep')}
        destructive
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate(order.id, { onSettled: () => setIsConfirmingCancel(false) })}
        onCancel={() => setIsConfirmingCancel(false)}
      />
    </Screen>
  );
}

/** Shown for an order address that is not a valid order number. */
export function OrderNotFound() {
  const { t } = useTranslation('orders');
  return <EmptyState title={t('detail.notFoundTitle')} message={t('detail.notFoundBody')} />;
}

interface CardProps {
  title: string;
  children: React.ReactNode;
}

function Card({ title, children }: CardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text accessibilityRole="header" style={styles.strong}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.strong : undefined}>{label}</Text>
      <Text style={strong ? styles.strong : undefined}>{value}</Text>
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  strong: {
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
});
