import { z } from 'zod';

import { NOTIFICATION_KINDS } from '../constants';

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** What a notification carries for the app: which kind it is and which order it is about. */
export interface NotificationPayload {
  kind: NotificationKind;
  orderId: number;
}

const payloadSchema = z.object({
  kind: z.enum(NOTIFICATION_KINDS),
  orderId: z.number().int().positive(),
});

/**
 * Reads the `data` of a notification the person tapped. It arrives from outside the app (a push
 * message), so it is checked rather than trusted: anything unexpected gives null and the tap is
 * ignored instead of opening a screen with a made-up address.
 */
export function parseNotificationPayload(data: unknown): NotificationPayload | null {
  const parsed = payloadSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
