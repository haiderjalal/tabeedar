/** `active` stores are visible to customers; `suspended` ones are hidden by the platform owner. */
export type StoreStatus = 'active' | 'suspended';

/**
 * The signed-in store owner's own store, with everything they can edit. Customers see the smaller
 * `StoreDetails` from the stores feature; this one also carries the map position and the status.
 */
export interface MyStore {
  id: number;
  name: string;
  description: string | null;
  phone: string | null;
  addressLine: string;
  area: string | null;
  city: string;
  latitude: number;
  longitude: number;
  /** Paths in the catalog bucket (see the media feature). */
  logoPath: string | null;
  coverPath: string | null;
  /** The owner's "accepting orders" switch. */
  isOpen: boolean;
  status: StoreStatus;
}
