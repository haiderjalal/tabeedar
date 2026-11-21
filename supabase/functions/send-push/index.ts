// Edge Function `send-push`: sends the notifications waiting in the `notifications` queue through
// Expo's push service.
//
// How it runs: a Database Webhook (INSERT on `notifications`) calls this function. The webhook's
// body is ignored on purpose: the function asks the database for whatever is waiting
// (`claim_notifications`), so a burst of webhooks cannot send anything twice, and one call also
// picks up rows an earlier call failed on. Setup steps are in docs/database.md.
//
// What it never does: put an address, a phone number or a customer's name in a notification. The
// queue holds only the order number and the store's name, and the wording is in `_shared`.
//
// This file is Deno code and is not type-checked by the app's `tsc`; the decisions live in
// `_shared/*.ts`, which are plain TypeScript with unit tests (`npm test`).
import { createClient } from 'npm:@supabase/supabase-js@2.119.2';

import {
  EXPO_BATCH_SIZE,
  buildMessages,
  chunk,
  judge,
  readTickets,
  type ClaimedNotification,
  type DeviceToken,
  type ExpoMessage,
  type TicketOutcome,
} from '../_shared/expo-push.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
/** Expo normally answers in well under a second; never wait on it for long. */
const EXPO_TIMEOUT_MS = 10_000;
/** The most rows taken per run. A burst larger than this is finished by the next webhook call. */
const CLAIM_LIMIT = 100;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Compares two secrets without stopping at the first difference (which would leak how much matched). */
function sameSecret(given: string, expected: string): boolean {
  if (given.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < given.length; i += 1) {
    difference |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return difference === 0;
}

function failedBatch(count: number, error: string): TicketOutcome[] {
  return Array.from({ length: count }, () => ({ ok: false as const, error, deadToken: false }));
}

/** Sends up to 100 messages and returns what Expo said about each. Never throws. */
async function sendBatch(messages: ExpoMessage[]): Promise<TicketOutcome[]> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  // Optional: only needed if "enhanced security" is switched on for the project at expo.dev.
  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXPO_TIMEOUT_MS);
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
      signal: controller.signal,
    });
    const body: unknown = await response.json().catch(() => null);
    return readTickets(body, messages.length);
  } catch (error) {
    // Only the kind of failure is logged: messages and tokens are personal and stay out of logs.
    console.error('Expo push request failed', error instanceof Error ? error.name : 'unknown');
    return failedBatch(messages.length, 'network_error');
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // The platform's own check is switched off for this function (the webhook has no user token), so
  // it must prove it knows the shared secret. A missing secret fails closed.
  const expectedSecret = Deno.env.get('PUSH_WEBHOOK_SECRET') ?? '';
  const givenSecret = request.headers.get('x-webhook-secret') ?? '';
  if (expectedSecret === '' || !sameSecret(givenSecret, expectedSecret)) {
    return json({ error: 'unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return json({ error: 'not_configured' }, 500);
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // 1. Take the waiting rows. Each row goes to exactly one run (see claim_notifications).
  const claim = await supabase.rpc('claim_notifications', { p_limit: CLAIM_LIMIT });
  if (claim.error) {
    console.error('claim_notifications failed', claim.error.code);
    return json({ error: 'claim_failed' }, 500);
  }
  const claimed = (claim.data ?? []) as ClaimedNotification[];
  if (claimed.length === 0) return json({ claimed: 0 });

  // 2. Find the phones of the people to tell.
  const userIds = [...new Set(claimed.map((n) => n.user_id))];
  const tokenQuery = await supabase
    .from('push_tokens')
    .select('user_id, token, language')
    .in('user_id', userIds);
  if (tokenQuery.error) {
    // The rows stay claimed; they are taken again after the two-minute lease.
    console.error('Reading push tokens failed', tokenQuery.error.code);
    return json({ error: 'tokens_failed' }, 500);
  }
  const devicesByUser = new Map<string, DeviceToken[]>();
  for (const row of tokenQuery.data ?? []) {
    const devices = devicesByUser.get(row.user_id) ?? [];
    devices.push({ token: row.token, language: row.language });
    devicesByUser.set(row.user_id, devices);
  }

  // 3. Write the messages, in each phone's language.
  const messagesByNotification = new Map<number, ExpoMessage[]>();
  const queue: { notificationId: number; message: ExpoMessage }[] = [];
  for (const notification of claimed) {
    const messages = buildMessages(notification, devicesByUser.get(notification.user_id) ?? []);
    messagesByNotification.set(notification.id, messages);
    for (const message of messages) queue.push({ notificationId: notification.id, message });
  }

  // 4. Send in batches of 100. Entries of one notification are contiguous and in order, so pushing
  //    each outcome in turn keeps it aligned with that notification's messages.
  const outcomesByNotification = new Map<number, TicketOutcome[]>();
  for (const batch of chunk(queue, EXPO_BATCH_SIZE)) {
    const outcomes = await sendBatch(batch.map((entry) => entry.message));
    batch.forEach((entry, index) => {
      const list = outcomesByNotification.get(entry.notificationId) ?? [];
      list.push(outcomes[index] ?? { ok: false, error: 'bad_response', deadToken: false });
      outcomesByNotification.set(entry.notificationId, list);
    });
  }

  // 5. Record what happened.
  const doneIds: number[] = [];
  const deadTokens: string[] = [];
  let retrying = 0;
  for (const notification of claimed) {
    const verdict = judge(
      messagesByNotification.get(notification.id) ?? [],
      outcomesByNotification.get(notification.id) ?? [],
    );
    deadTokens.push(...verdict.deadTokens);
    if (verdict.done) {
      doneIds.push(notification.id);
    } else {
      retrying += 1;
      // Left unsent: it is taken again after the lease, until the three attempts are used up.
      await supabase
        .from('notifications')
        .update({ last_error: (verdict.error ?? 'unknown').slice(0, 500) })
        .eq('id', notification.id);
    }
  }
  if (doneIds.length > 0) {
    const { error } = await supabase
      .from('notifications')
      .update({ sent_at: new Date().toISOString(), last_error: null })
      .in('id', doneIds);
    if (error) console.error('Marking notifications as sent failed', error.code);
  }
  if (deadTokens.length > 0) {
    await supabase.from('push_tokens').delete().in('token', deadTokens);
  }

  return json({
    claimed: claimed.length,
    sent: doneIds.length,
    retrying,
    messages: queue.length,
    removedTokens: deadTokens.length,
  });
});
