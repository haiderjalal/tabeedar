/** One of the customer's saved delivery addresses. */
export interface Address {
  id: number;
  /** A name the customer gives it, such as "Home". */
  label: string;
  /** Set when the address is for someone else. */
  recipientName: string | null;
  recipientPhone: string | null;
  addressLine: string;
  area: string | null;
  city: string;
  instructions: string | null;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}
