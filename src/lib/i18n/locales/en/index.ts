import { addresses } from './addresses';
import { auth } from './auth';
import { cart } from './cart';
import { catalog } from './catalog';
import { checkout } from './checkout';
import { common } from './common';
import { location } from './location';
import { media } from './media';
import { navigation } from './navigation';
import { notifications } from './notifications';
import { orders } from './orders';
import { rider } from './rider';
import { shop } from './shop';
import { storeOrders } from './store-orders';
import { stores } from './stores';

/** One entry per namespace. Features add their own namespace here as they are built. */
export const en = {
  common,
  auth,
  navigation,
  stores,
  cart,
  addresses,
  location,
  media,
  checkout,
  orders,
  shop,
  catalog,
  storeOrders,
  rider,
  notifications,
};
