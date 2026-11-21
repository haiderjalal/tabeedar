import { isImagePathOfStore } from '@/features/media/utils/image-path';
import { normalizePhone } from '@/lib/phone';

/** What the store form collects. Optional text is an empty string when left blank. */
export interface ShopFormValues {
  name: string;
  description: string;
  phone: string;
  addressLine: string;
  area: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  logoPath: string | null;
  coverPath: string | null;
}

/** The columns of the `stores` table that the app writes. */
export interface ShopPayload {
  name: string;
  description: string | null;
  phone: string | null;
  address_line: string;
  area: string | null;
  city: string;
  latitude: number;
  longitude: number;
  logo_url: string | null;
  cover_url: string | null;
}

function blankToNull(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Converts form values to database columns: blank optional fields become null (the database
 * rejects empty strings there), text is trimmed and the phone is normalized.
 *
 * `storeId` is the store being edited, or null while it is being created. A new store has no
 * pictures yet (their paths contain the store's id), and an edited store may only point at pictures
 * inside its own folder. Throws if the position is missing or a picture is not the store's own:
 * the form schema and the screen should have stopped both earlier.
 */
export function toShopPayload(values: ShopFormValues, storeId: number | null): ShopPayload {
  if (values.latitude === null || values.longitude === null) {
    throw new Error('A store needs a map position.');
  }

  const pictures = [values.logoPath, values.coverPath];
  for (const path of pictures) {
    if (path !== null && (storeId === null || !isImagePathOfStore(path, storeId))) {
      throw new Error('A picture does not belong to this store.');
    }
  }

  const phone = blankToNull(values.phone);

  return {
    name: values.name.trim(),
    description: blankToNull(values.description),
    phone: phone === null ? null : normalizePhone(phone),
    address_line: values.addressLine.trim(),
    area: blankToNull(values.area),
    city: values.city.trim(),
    latitude: values.latitude,
    longitude: values.longitude,
    logo_url: values.logoPath,
    cover_url: values.coverPath,
  };
}
