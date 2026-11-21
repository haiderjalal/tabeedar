import type { TFunction } from 'i18next';
import { z } from 'zod';

import { isValidCoordinates } from '@/features/location/utils/coordinates';
import { isValidPhone, normalizePhone } from '@/lib/phone';

import {
  MAX_ADDRESS_LINE_LENGTH,
  MAX_AREA_LENGTH,
  MAX_CITY_LENGTH,
  MAX_STORE_DESCRIPTION_LENGTH,
  MAX_STORE_NAME_LENGTH,
} from '../constants';
import type { MyStore } from '../types';

/** A `stores` row as the owner reads it. */
const myStoreRow = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  phone: z.string().nullable(),
  address_line: z.string(),
  area: z.string().nullable(),
  city: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  logo_url: z.string().nullable(),
  cover_url: z.string().nullable(),
  is_open: z.boolean(),
  status: z.enum(['active', 'suspended']),
});

/** Columns to request (never `select *`, which would include the unreadable `location`). */
export const MY_STORE_COLUMNS =
  'id, name, description, phone, address_line, area, city, latitude, longitude, logo_url, cover_url, is_open, status';

export function parseMyStore(row: unknown): MyStore {
  const parsed = myStoreRow.parse(row);
  return {
    id: parsed.id,
    name: parsed.name,
    description: parsed.description,
    phone: parsed.phone,
    addressLine: parsed.address_line,
    area: parsed.area,
    city: parsed.city,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    logoPath: parsed.logo_url,
    coverPath: parsed.cover_url,
    isOpen: parsed.is_open,
    status: parsed.status,
  };
}

/**
 * Validation for the store form, with messages in the current language. The same rules exist as
 * database constraints. The map position is not typed: it comes from the location button or a
 * pasted link, and the form is not valid until it is set.
 */
export function createShopFormSchema(t: TFunction<'shop'>) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t('validation.nameRequired'))
        .max(MAX_STORE_NAME_LENGTH, t('validation.tooLong', { max: MAX_STORE_NAME_LENGTH })),
      description: z
        .string()
        .trim()
        .max(
          MAX_STORE_DESCRIPTION_LENGTH,
          t('validation.tooLong', { max: MAX_STORE_DESCRIPTION_LENGTH }),
        ),
      phone: z
        .string()
        .refine((value) => value.trim() === '' || isValidPhone(normalizePhone(value)), {
          error: t('validation.phoneInvalid'),
        }),
      addressLine: z
        .string()
        .trim()
        .min(1, t('validation.addressRequired'))
        .max(MAX_ADDRESS_LINE_LENGTH, t('validation.tooLong', { max: MAX_ADDRESS_LINE_LENGTH })),
      area: z
        .string()
        .trim()
        .max(MAX_AREA_LENGTH, t('validation.tooLong', { max: MAX_AREA_LENGTH })),
      city: z
        .string()
        .trim()
        .min(1, t('validation.cityRequired'))
        .max(MAX_CITY_LENGTH, t('validation.tooLong', { max: MAX_CITY_LENGTH })),
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
      logoPath: z.string().nullable(),
      coverPath: z.string().nullable(),
    })
    .refine(
      (values) =>
        values.latitude !== null &&
        values.longitude !== null &&
        isValidCoordinates({ latitude: values.latitude, longitude: values.longitude }),
      { error: t('validation.locationRequired'), path: ['latitude'] },
    );
}
