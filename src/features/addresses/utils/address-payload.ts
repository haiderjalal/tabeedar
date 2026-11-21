import { normalizePhone } from '@/lib/phone';

/** What the address form collects. Optional text is an empty string when left blank. */
export interface AddressFormValues {
  label: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  area: string;
  city: string;
  instructions: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

/** The columns of the `addresses` table that the app writes. */
export interface AddressPayload {
  label: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  address_line: string;
  area: string | null;
  city: string;
  instructions: string | null;
  latitude: number;
  longitude: number;
  is_default: boolean;
}

function blankToNull(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Converts form values to database columns. Blank optional fields become null (the database
 * rejects empty strings in these columns), text is trimmed, and the phone is normalized.
 * Throws if the position is missing: the form schema should have stopped that earlier.
 */
export function toAddressPayload(values: AddressFormValues): AddressPayload {
  if (values.latitude === null || values.longitude === null) {
    throw new Error('An address needs a map position.');
  }

  const recipientPhone = blankToNull(values.recipientPhone);

  return {
    label: values.label.trim(),
    recipient_name: blankToNull(values.recipientName),
    recipient_phone: recipientPhone === null ? null : normalizePhone(recipientPhone),
    address_line: values.addressLine.trim(),
    area: blankToNull(values.area),
    city: values.city.trim(),
    instructions: blankToNull(values.instructions),
    latitude: values.latitude,
    longitude: values.longitude,
    is_default: values.isDefault,
  };
}
