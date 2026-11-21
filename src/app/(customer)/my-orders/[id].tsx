import { useLocalSearchParams } from 'expo-router';

import { OrderDetailScreen, OrderNotFound } from '@/features/orders/screens/order-detail-screen';
import { parseIdParam } from '@/lib/route-params';

export default function OrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = parseIdParam(id);

  return orderId === null ? <OrderNotFound /> : <OrderDetailScreen orderId={orderId} />;
}
