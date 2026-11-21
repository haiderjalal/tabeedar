// Turning queued notifications into Expo push messages, and reading Expo's answer. Pure functions (no
// Deno, no network): the Edge Function does the sending, this file decides what is sent and what the
// answer means, so it can be unit tested with the app's tests (`npm test`).
import {
  buildPushText,
  isNotificationKind,
  isPushLanguage,
  readParams,
  type NotificationKind,
  type PushLanguage,
} from './push-messages.ts';

/** Expo accepts at most 100 messages in one request. */
export const EXPO_BATCH_SIZE = 100;

/** The Android channel the app creates (and must create before registering) for order notifications. */
export const ANDROID_CHANNEL_ID = 'orders';

/** A queued row, as returned by `claim_notifications`. */
export interface ClaimedNotification {
  id: number;
  user_id: string;
  kind: string;
  params: unknown;
}

/** One phone belonging to the person to notify. */
export interface DeviceToken {
  token: string;
  language: string;
}

export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: { kind: NotificationKind; orderId: number };
  sound: 'default';
  priority: 'high';
  channelId: typeof ANDROID_CHANNEL_ID;
  ttl: number;
}

/**
 * How long Expo may keep trying to deliver, in seconds. A "new delivery nearby" alert is useless
 * after a few minutes (someone else has taken it); order news stays useful for hours.
 */
export function ttlFor(kind: NotificationKind): number {
  return kind === 'delivery_available' ? 10 * 60 : 6 * 60 * 60;
}

/**
 * The messages for one queued notification: one per phone, each in that phone's own language.
 * An unknown kind or unreadable parameters give no messages (the row is then marked as handled,
 * because retrying cannot fix it).
 */
export function buildMessages(
  notification: ClaimedNotification,
  devices: readonly DeviceToken[],
): ExpoMessage[] {
  if (!isNotificationKind(notification.kind)) return [];
  const params = readParams(notification.params);
  if (params === null) return [];
  const kind = notification.kind;

  return devices.map((device) => {
    const language: PushLanguage = isPushLanguage(device.language) ? device.language : 'en';
    const { title, body } = buildPushText(kind, language, params);
    return {
      to: device.token,
      title,
      body,
      data: { kind, orderId: params.orderId },
      sound: 'default',
      priority: 'high',
      channelId: ANDROID_CHANNEL_ID,
      ttl: ttlFor(kind),
    };
  });
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

/** What Expo said about one message. */
export type TicketOutcome = { ok: true } | { ok: false; error: string; deadToken: boolean };

/**
 * Reads Expo's reply to a batch of `count` messages. The tickets come back in the order the messages
 * were sent. Anything unexpected (a missing or malformed reply) counts as a failure for every
 * message, so it is retried rather than assumed delivered.
 */
export function readTickets(response: unknown, count: number): TicketOutcome[] {
  const failAll = (error: string): TicketOutcome[] =>
    Array.from({ length: count }, () => ({ ok: false, error, deadToken: false }));

  if (typeof response !== 'object' || response === null) return failAll('bad_response');
  const { data, errors } = response as { data?: unknown; errors?: unknown };

  if (!Array.isArray(data)) {
    // The whole request failed; Expo explains in `errors`.
    const first = Array.isArray(errors) ? (errors[0] as { code?: unknown } | undefined) : undefined;
    return failAll(typeof first?.code === 'string' ? first.code : 'bad_response');
  }
  if (data.length !== count) return failAll('bad_response');

  return data.map((ticket): TicketOutcome => {
    const { status, details } = (ticket ?? {}) as {
      status?: unknown;
      details?: { error?: unknown };
    };
    if (status === 'ok') return { ok: true };
    const error = typeof details?.error === 'string' ? details.error : 'unknown_error';
    // Expo tells us to stop sending to a phone that can no longer receive notifications.
    return { ok: false, error, deadToken: error === 'DeviceNotRegistered' };
  });
}

/** The verdict on one queued notification once every one of its messages has been sent. */
export interface NotificationVerdict {
  /** True when the row can be marked as sent: nothing to send, or at least one phone accepted it. */
  done: boolean;
  /** The reason it is not done, for the `last_error` column. */
  error: string | null;
  /** Tokens Expo says are dead; the function deletes them. */
  deadTokens: string[];
}

export function judge(
  messages: readonly ExpoMessage[],
  outcomes: readonly TicketOutcome[],
): NotificationVerdict {
  // Nothing to send (the person has no phone, or the row is unusable): done, retrying changes nothing.
  if (messages.length === 0) return { done: true, error: null, deadTokens: [] };

  const deadTokens: string[] = [];
  let accepted = 0;
  let firstError: string | null = null;
  for (const [index, outcome] of outcomes.entries()) {
    if (outcome.ok) {
      accepted += 1;
      continue;
    }
    firstError ??= outcome.error;
    const message = messages[index];
    if (outcome.deadToken && message) deadTokens.push(message.to);
  }

  // One working phone is enough: the person has been told. Failures on the others are not retried.
  if (accepted > 0) return { done: true, error: null, deadTokens };
  // If every phone is dead there is nobody left to retry: done, and the dead tokens are removed.
  if (deadTokens.length === messages.length) return { done: true, error: null, deadTokens };
  return { done: false, error: firstError, deadTokens };
}
