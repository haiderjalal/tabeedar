import { useLocalSearchParams } from 'expo-router';

import {
  StoreOrderDetailScreen,
  StoreOrderNotFound,
} from '@/features/orders/screens/store-order-detail-screen';
import { parseIdParam } from '@/lib/route-params';

export default function StoreOrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = parseIdParam(id);

  return orderId === null ? <StoreOrderNotFound /> : <StoreOrderDetailScreen orderId={orderId} />;
}
