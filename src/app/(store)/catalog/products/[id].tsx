import { Redirect, useLocalSearchParams } from 'expo-router';

import { ProductFormScreen } from '@/features/catalog/screens/product-form-screen';
import { parseIdParam } from '@/lib/route-params';

export default function EditProductRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseIdParam(id);

  return productId === null ? (
    <Redirect href="/catalog" />
  ) : (
    <ProductFormScreen productId={productId} />
  );
}
