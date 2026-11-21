import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
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
import { StatusNoteDialog } from '../components/status-note-dialog';
import { useChangeOrderStatus } from '../hooks/use-change-order-status';
import { useOrderDetail } from '../hooks/use-order-detail';
import { toOrderErrorKey } from '../utils/order-error';
import { isActiveStatus } from '../utils/order-status';
import { storeActionsFor, type StoreOrderAction } from '../utils/store-order-actions';

interface StoreOrderDetailScreenProps {
  orderId: number;
}

/**
 * One order as the store sees it: who it is for and where it goes, what to prepare, how it has
 * progressed, and the buttons that move it forward. Refreshes by itself while the order is in
 * progress, so a customer cancelling or a rider accepting shows up without any action.
 */
export function StoreOrderDetailScreen({ orderId }: StoreOrderDetailScreenProps) {
  const { t } = useTranslation('storeOrders');
  const { t: tOrders } = useTranslation('orders');
  const { language } = useLanguage();
  const detail = useOrderDetail(orderId);
  const change = useChangeOrderStatus();
  // The move waiting for the store's reason (declining or cancelling), if any.
  const [pendingAction, setPendingAction] = useState<StoreOrderAction | null>(null);

  if (detail.isPending) return <LoadingState />;
  if (detail.isError) {
    return <ErrorState message={t('detail.loadError')} onRetry={() => void detail.refetch()} />;
  }
  if (!detail.data) return <StoreOrderNotFound />;

  const { order, items, events, rider } = detail.data;
  const place = [order.area, order.city].filter(Boolean).join(', ');
  const actions = storeActionsFor(order.status);

  function run(action: StoreOrderAction, note: string | null): void {
    change.mutate({ orderId: order.id, status: action.to, note });
  }

  function press(action: StoreOrderAction): void {
    if (action.asksForNote) setPendingAction(action);
    else run(action, null);
  }

  return (
    <Screen edges={['bottom', 'left', 'right']} padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="heading" accessibilityRole="header">
            {tOrders('detail.orderNumber', { id: order.id })}
          </Text>
          <OrderStatusChip status={order.status} perspective="store" />
          <Text variant="caption" tone="muted">
            {tOrders('detail.placedAt', { date: formatDateTime(order.createdAt, language) })}
          </Text>
        </View>

        {change.isError ? (
          <ErrorBanner message={t(`errors.${toOrderErrorKey(change.error)}`)} />
        ) : null}

        {actions.length > 0 ? (
          <View style={styles.actions}>
            {actions.map((action) => (
              <Button
                key={action.to}
                label={t(`actions.${action.to}`)}
                variant={action.tone}
                loading={change.isPending && change.variables?.status === action.to}
                disabled={change.isPending}
                onPress={() => press(action)}
              />
            ))}
          </View>
        ) : null}

        <Card title={tOrders('detail.items')}>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.flex}>
                {tOrders('detail.itemLine', { quantity: item.quantity, name: item.productName })}
              </Text>
              <Text>{formatRupees(item.lineTotal)}</Text>
            </View>
          ))}
          <Divider />
          <Row label={tOrders('detail.subtotal')} value={formatRupees(order.subtotal)} />
          <Row label={tOrders('detail.deliveryFee')} value={formatRupees(order.deliveryFee)} />
          <Row label={tOrders('detail.total')} value={formatRupees(order.total)} strong />
        </Card>

        <Card title={t('detail.customer')}>
          <Text style={styles.strong}>{order.recipientName}</Text>
          <Button
            label={order.recipientPhone}
            accessibilityLabel={t('detail.call', { name: order.recipientName })}
            variant="secondary"
            onPress={() => void Linking.openURL(`tel:${order.recipientPhone}`)}
          />
          <Text style={styles.strong}>{t('detail.address')}</Text>
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
              {t('detail.customerNote')}: {order.notes}
            </Text>
          ) : null}
        </Card>

        {/* Hidden once the order is over without a rider on it (declined, cancelled): nothing to say. */}
        {rider || isActiveStatus(order.status) ? (
          <Card title={t('detail.rider')}>
            {rider ? (
              <>
                <Text>{rider.name ?? tOrders('detail.riderUnknown')}</Text>
                {rider.phone ? (
                  <Button
                    label={rider.phone}
                    variant="secondary"
                    onPress={() => void Linking.openURL(`tel:${rider.phone}`)}
                  />
                ) : null}
              </>
            ) : (
              <Text tone="muted">
                {order.status === 'placed' ? t('detail.riderWaiting') : t('detail.riderRequested')}
              </Text>
            )}
          </Card>
        ) : null}

        <Card title={tOrders('detail.progress')}>
          <OrderTimeline events={events} perspective="store" />
        </Card>
      </ScrollView>

      {pendingAction ? (
        <StatusNoteDialog
          visible
          title={t(`note.${noteKind(pendingAction)}.title`)}
          message={t(`note.${noteKind(pendingAction)}.body`)}
          noteLabel={t('note.label')}
          noteHint={t('note.hint')}
          confirmLabel={t(`note.${noteKind(pendingAction)}.confirm`)}
          cancelLabel={t('note.back')}
          loading={change.isPending}
          onConfirm={(note) => {
            // Close as soon as the answer is in, whether it worked or not: a failure is shown in
            // the banner above and the screen refreshes to the order's real state.
            change.mutate(
              { orderId: order.id, status: pendingAction.to, note },
              { onSettled: () => setPendingAction(null) },
            );
          }}
          onCancel={() => setPendingAction(null)}
        />
      ) : null}
    </Screen>
  );
}

/** Which wording the reason dialog uses. Only declining and cancelling ask for a reason. */
function noteKind(action: StoreOrderAction): 'rejected' | 'cancelled' {
  return action.to === 'rejected' ? 'rejected' : 'cancelled';
}

/** Shown for an order address that is not a valid order number, or an order of another store. */
export function StoreOrderNotFound() {
  const { t } = useTranslation('storeOrders');
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
  actions: {
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
