import { ShopFormScreen } from '@/features/shop/screens/shop-form-screen';

/** First screen of a new store account: the store has to exist before anything else is shown. */
export default function SetupStoreRoute() {
  return <ShopFormScreen existing={null} />;
}
