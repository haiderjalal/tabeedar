import { useLocalSearchParams } from 'expo-router';

import {
  DeliveryDetailScreen,
  DeliveryNotFound,
} from '@/features/dispatch/screens/delivery-detail-screen';
import { parseIdParam } from '@/lib/route-params';

export default function DeliveryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = parseIdParam(id);

  return orderId === null ? <DeliveryNotFound /> : <DeliveryDetailScreen orderId={orderId} />;
}
