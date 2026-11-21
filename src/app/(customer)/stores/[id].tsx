import { useLocalSearchParams } from 'expo-router';

import { StoreNotFound, StoreScreen } from '@/features/stores/screens/store-screen';
import { parseIdParam } from '@/lib/route-params';

export default function StoreRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const storeId = parseIdParam(id);

  return storeId === null ? <StoreNotFound /> : <StoreScreen storeId={storeId} />;
}
