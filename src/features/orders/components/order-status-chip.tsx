import { useTranslation } from 'react-i18next';

import { StatusChip } from '@/components/status-chip';

import type { OrderStatus } from '../utils/order-status';

type ChipTone = 'success' | 'danger' | 'primary' | 'muted';

const STATUS_TONE: Record<OrderStatus, ChipTone> = {
  placed: 'muted',
  accepted: 'primary',
  preparing: 'primary',
  ready: 'primary',
  picked_up: 'primary',
  delivered: 'success',
  rejected: 'danger',
  cancelled: 'danger',
};

interface OrderStatusChipProps {
  status: OrderStatus;
  /**
   * Whose words to use: a customer reads "On the way", the store reads "Picked up by the rider",
   * the rider reads "On the way to the customer".
   */
  perspective?: 'customer' | 'store' | 'rider';
}

/** The order's status in words the reader understands. */
export function OrderStatusChip({ status, perspective = 'customer' }: OrderStatusChipProps) {
  const { t } = useTranslation('orders');
  const { t: tStore } = useTranslation('storeOrders');
  const { t: tRider } = useTranslation('rider');

  const label =
    perspective === 'store'
      ? tStore(`status.${status}`)
      : perspective === 'rider'
        ? tRider(`status.${status}`)
        : t(`status.${status}`);
  return <StatusChip label={label} tone={STATUS_TONE[status]} />;
}
