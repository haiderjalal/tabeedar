import type { Href } from 'expo-router';

import type { UserRole } from '../types';

/**
 * The first screen of each role's area. Each role has its own route group in `src/app`:
 * `(customer)`, `(store)` and `(rider)`. Route groups add nothing to the URL, so every area's
 * landing screen needs a different file name.
 *
 * A store without a store yet, and a rider who is not approved, are sent on from here to the setup
 * or status screen by their area's own layout.
 */
export const ROLE_HOME: Record<UserRole, Href> = {
  customer: '/home',
  store: '/orders',
  rider: '/offers',
};
