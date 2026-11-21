import type { TFunction } from 'i18next';
import { z } from 'zod';

import { isValidCoordinates } from '@/features/location/utils/coordinates';
import { isValidPhone, normalizePhone } from '@/lib/phone';

import {
  MAX_ADDRESS_LINE_LENGTH,
  MAX_AREA_LENGTH,
  MAX_CITY_LENGTH,
  MAX_INSTRUCTIONS_LENGTH,
  MAX_LABEL_LENGTH,
  MAX_NAME_LENGTH,
} from '../constants';
import type { Address } from '../types';

/** A `addresses` row as the database returns it. */
const addressRow = z.object({
  id: z.number().int(),
  label: z.string(),
  recipient_name: z.string().nullable(),
  recipient_phone: z.string().nullable(),
  address_line: z.string(),
  area: z.string().nullable(),
  city: z.string(),
  instructions: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  is_default: z.boolean(),
});

/** Columns to request (never `select *`, which would include the unreadable `location`). */
export const ADDRESS_COLUMNS =
  'id, label, recipient_name, recipient_phone, address_line, area, city, instructions, latitude, longitude, is_default';

export function parseAddresses(rows: unknown): Address[] {
  return z
    .array(addressRow)
    .parse(rows)
    .map((row) => toAddress(row));
}

export function parseAddress(row: unknown): Address {
  return toAddress(addressRow.parse(row));
}

function toAddress(row: z.infer<typeof addressRow>): Address {
  return {
    id: row.id,
    label: row.label,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    addressLine: row.address_line,
    area: row.area,
    city: row.city,
    instructions: row.instructions,
    latitude: row.latitude,
    longitude: row.longitude,
    isDefault: row.is_default,
  };
}

/**
 * Validation for the address form, with messages in the current language. The same rules exist as
 * database constraints. The map position is not typed in: it comes from the location button or a
 * pasted link, and the form is not valid until it is set.
 */
export function createAddressFormSchema(t: TFunction<'addresses'>) {
  return z
    .object({
      label: z
        .string()
        .trim()
        .min(1, t('validation.labelRequired'))
        .max(MAX_LABEL_LENGTH, t('validation.tooLong', { max: MAX_LABEL_LENGTH })),
      recipientName: z
        .string()
        .trim()
        .max(MAX_NAME_LENGTH, t('validation.tooLong', { max: MAX_NAME_LENGTH })),
      recipientPhone: z
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
      instructions: z
        .string()
        .trim()
        .max(MAX_INSTRUCTIONS_LENGTH, t('validation.tooLong', { max: MAX_INSTRUCTIONS_LENGTH })),
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
      isDefault: z.boolean(),
    })
    .refine(
      (values) =>
        values.latitude !== null &&
        values.longitude !== null &&
        isValidCoordinates({ latitude: values.latitude, longitude: values.longitude }),
      { error: t('validation.locationRequired'), path: ['latitude'] },
    );
}
