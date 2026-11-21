import { Redirect, useLocalSearchParams } from 'expo-router';

import { AddressFormScreen } from '@/features/addresses/screens/address-form-screen';
import { parseIdParam } from '@/lib/route-params';

export default function EditAddressRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const addressId = parseIdParam(id);

  return addressId === null ? (
    <Redirect href="/addresses" />
  ) : (
    <AddressFormScreen addressId={addressId} />
  );
}
