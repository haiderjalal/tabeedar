import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { ErrorBanner } from '@/components/error-banner';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { useGoBack } from '@/hooks/use-go-back';
import { spacing } from '@/theme';

import { AddressCard } from '../components/address-card';
import { useDeleteAddress } from '../hooks/use-addresses';
import { useSelectedAddress } from '../hooks/use-selected-address';
import { useSelectedAddressStore } from '../store/selected-address-store';
import type { Address } from '../types';

/**
 * The customer's saved addresses. Choosing "Deliver here" sets where browsing and checkout deliver
 * to and goes back to where the customer came from.
 */
export function AddressListScreen() {
  const { t } = useTranslation('addresses');
  const { t: tCommon } = useTranslation();
  const router = useRouter();
  // Choosing an address returns to wherever the customer came from, or to the stores.
  const goBack = useGoBack('/home');

  const { address: selected, addresses, isLoading, isError, refetch } = useSelectedAddress();
  const select = useSelectedAddressStore((state) => state.select);
  const deleteAddress = useDeleteAddress();
  const [toDelete, setToDelete] = useState<Address | null>(null);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={t('list.loadError')} onRetry={refetch} />;

  function chooseAddress(addressId: number): void {
    select(addressId);
    goBack();
  }

  return (
    <Screen edges={['bottom', 'left', 'right']} padded={false}>
      <FlatList
        data={addresses}
        keyExtractor={(address) => String(address.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <AddressCard
            address={item}
            isSelected={item.id === selected?.id}
            onSelect={() => chooseAddress(item.id)}
            onEdit={() =>
              router.push({ pathname: '/addresses/[id]', params: { id: String(item.id) } })
            }
            onDelete={() => setToDelete(item)}
          />
        )}
        ListHeaderComponent={
          deleteAddress.isError ? <ErrorBanner message={t('list.deleteFailed')} /> : undefined
        }
        ListEmptyComponent={
          <EmptyState title={t('list.emptyTitle')} message={t('list.emptyBody')} />
        }
      />

      <View style={styles.footer}>
        <Button label={t('list.add')} onPress={() => router.push('/addresses/new')} />
      </View>

      <ConfirmDialog
        visible={toDelete !== null}
        title={t('list.deleteConfirm.title')}
        message={t('list.deleteConfirm.body', { label: toDelete?.label ?? '' })}
        confirmLabel={tCommon('actions.delete')}
        cancelLabel={tCommon('actions.cancel')}
        destructive
        loading={deleteAddress.isPending}
        onConfirm={() => {
          if (toDelete) deleteAddress.mutate(toDelete.id, { onSettled: () => setToDelete(null) });
        }}
        onCancel={() => setToDelete(null)}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    padding: spacing.lg,
  },
});
