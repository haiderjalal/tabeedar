import { useState, type ReactNode } from 'react';
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
import { buildDirectionsUrl } from '@/features/location/utils/maps-link';
import { OrderStatusChip } from '@/features/orders/components/order-status-chip';
import { useChangeOrderStatus } from '@/features/orders/hooks/use-change-order-status';
import { isActiveStatus } from '@/features/orders/utils/order-status';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, formatRupees } from '@/lib/format';
import { radius, spacing } from '@/theme';

import { useDeliveryDetail } from '../hooks/use-deliveries';
import type { PickupStore } from '../types';
import { toDispatchErrorKey } from '../utils/dispatch-error';
import { riderActionFor } from '../utils/rider-actions';

interface DeliveryDetailScreenProps {
  orderId: number;
}

/**
 * One delivery as the rider who accepted it sees it: where to collect it, where to take it, how much
 * cash to collect, and the one button that moves it forward (picked up, then delivered). It refreshes
 * by itself, so the store marking the order ready (or cancelling it) shows up without any action.
 */
export function DeliveryDetailScreen({ orderId }: DeliveryDetailScreenProps) {
  const { t } = useTranslation('rider');
  const { t: tOrders } = useTranslation('orders');
  const { language } = useLanguage();
  const detail = useDeliveryDetail(orderId);
  const change = useChangeOrderStatus();
  const [isConfirmingDelivered, setIsConfirmingDelivered] = useState(false);

  if (detail.isPending) return <LoadingState />;
  if (detail.isError) {
    return <ErrorState message={t('detail.loadError')} onRetry={() => void detail.refetch()} />;
  }
  if (!detail.data) return <DeliveryNotFound />;

  const { order, items, store } = detail.data;
  const action = riderActionFor(order.status);
  const isActive = isActiveStatus(order.status);
  const place = [order.area, order.city].filter(Boolean).join(', ');

  function press(): void {
    if (action === 'delivered') setIsConfirmingDelivered(true);
    else if (action) change.mutate({ orderId: order.id, status: action, note: null });
  }

  return (
    <Screen edges={['bottom', 'left', 'right']} padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="heading" accessibilityRole="header">
            {tOrders('detail.orderNumber', { id: order.id })}
          </Text>
          <OrderStatusChip status={order.status} perspective="rider" />
          <Text variant="caption" tone="muted">
            {tOrders('detail.placedAt', { date: formatDateTime(order.createdAt, language) })}
          </Text>
        </View>

        {change.isError ? (
          <ErrorBanner message={t(`errors.${toDispatchErrorKey(change.error)}`)} />
        ) : null}

        {order.status === 'cancelled' ? (
          <Card title={tOrders('status.cancelled')}>
            <Text>{t('detail.cancelledNotice')}</Text>
          </Card>
        ) : null}
        {order.status === 'delivered' ? (
          <Card title={tOrders('status.delivered')}>
            <Text>{t('detail.deliveredNotice')}</Text>
          </Card>
        ) : null}

        {isActive ? (
          <Card title={t('detail.collect')} highlight>
            <Text variant="heading" tone="primary">
              {formatRupees(order.total)}
            </Text>
            <Text variant="caption" tone="muted">
              {t('detail.collectBody', { amount: formatRupees(order.total) })}
            </Text>
          </Card>
        ) : null}

        {action ? (
          <Button label={t(`actions.${action}`)} loading={change.isPending} onPress={press} />
        ) : null}

        <Card title={t('detail.store')}>
          <StoreDetails store={store} fallbackName={order.storeName} />
        </Card>

        <Card title={t('detail.customer')}>
          <Text style={styles.strong}>{order.recipientName}</Text>
          <Button
            label={order.recipientPhone}
            accessibilityLabel={t('detail.call', { name: order.recipientName })}
            variant="secondary"
            onPress={() => void Linking.openURL(`tel:${order.recipientPhone}`)}
          />
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
          <MapsButton
            name={order.recipientName}
            latitude={order.latitude}
            longitude={order.longitude}
          />
        </Card>

        <Card title={t('detail.items')}>
          {items.map((item) => (
            <Text key={item.id}>
              {tOrders('detail.itemLine', { quantity: item.quantity, name: item.productName })}
            </Text>
          ))}
        </Card>
      </ScrollView>

      <ConfirmDialog
        visible={isConfirmingDelivered}
        title={t('deliveredConfirm.title')}
        message={t('deliveredConfirm.body', { amount: formatRupees(order.total) })}
        confirmLabel={t('deliveredConfirm.confirm')}
        cancelLabel={t('deliveredConfirm.back')}
        loading={change.isPending}
        onConfirm={() =>
          change.mutate(
            { orderId: order.id, status: 'delivered', note: null },
            // Close as soon as the answer is in; a failure shows in the banner above.
            { onSettled: () => setIsConfirmingDelivered(false) },
          )
        }
        onCancel={() => setIsConfirmingDelivered(false)}
      />
    </Screen>
  );
}

interface StoreDetailsProps {
  store: PickupStore | null;
  fallbackName: string;
}

/** The pickup point. The store may be unreadable (for example suspended): then only its name is known. */
function StoreDetails({ store, fallbackName }: StoreDetailsProps) {
  const { t } = useTranslation('rider');

  if (store === null) {
    return (
      <>
        <Text style={styles.strong}>{fallbackName}</Text>
        <Text variant="caption" tone="muted">
          {t('detail.storeUnknown')}
        </Text>
      </>
    );
  }

  const place = [store.area, store.city].filter(Boolean).join(', ');
  return (
    <>
      <Text style={styles.strong}>{store.name}</Text>
      {store.phone ? (
        <Button
          label={store.phone}
          accessibilityLabel={t('detail.call', { name: store.name })}
          variant="secondary"
          onPress={() => void Linking.openURL(`tel:${store.phone}`)}
        />
      ) : null}
      <Text>{store.addressLine}</Text>
      <Text variant="caption" tone="muted">
        {place}
      </Text>
      <MapsButton name={store.name} latitude={store.latitude} longitude={store.longitude} />
    </>
  );
}

interface MapsButtonProps {
  name: string;
  latitude: number;
  longitude: number;
}

function MapsButton({ name, latitude, longitude }: MapsButtonProps) {
  const { t } = useTranslation('rider');
  return (
    <Button
      label={t('detail.openMaps')}
      accessibilityLabel={t('detail.mapsLabel', { name })}
      variant="secondary"
      onPress={() => void Linking.openURL(buildDirectionsUrl({ latitude, longitude }))}
    />
  );
}

/** Shown for a delivery address that is not a valid order number, or a delivery of another rider. */
export function DeliveryNotFound() {
  const { t } = useTranslation('rider');
  return <EmptyState title={t('detail.notFoundTitle')} message={t('detail.notFoundBody')} />;
}

interface CardProps {
  title: string;
  children: ReactNode;
  /** A stronger border for the one thing the rider must not miss (the cash to collect). */
  highlight?: boolean;
}

function Card({ title, children, highlight = false }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: highlight ? colors.primary : colors.border,
          borderWidth: highlight ? 2 : 1,
        },
      ]}
    >
      <Text accessibilityRole="header" style={styles.strong}>
        {title}
      </Text>
      {children}
    </View>
  );
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
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  strong: {
    fontWeight: '600',
  },
});
