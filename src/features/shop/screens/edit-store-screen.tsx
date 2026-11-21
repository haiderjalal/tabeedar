import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';

import { useMyStore } from '../hooks/use-my-store';

import { ShopFormScreen } from './shop-form-screen';

/** Edits the store's details and pictures. Loads the store first so the form starts filled in. */
export function EditStoreScreen() {
  const { t } = useTranslation('shop');
  const store = useMyStore();

  if (store.isPending) return <LoadingState />;
  if (store.isError || !store.data) {
    return <ErrorState message={t('loadError')} onRetry={() => void store.refetch()} />;
  }
  return <ShopFormScreen existing={store.data} />;
}
