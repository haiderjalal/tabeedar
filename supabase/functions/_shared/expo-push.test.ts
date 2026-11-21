import { describe, expect, it } from 'vitest';

import {
  EXPO_BATCH_SIZE,
  buildMessages,
  chunk,
  judge,
  readTickets,
  ttlFor,
  type ClaimedNotification,
} from './expo-push';

const notification: ClaimedNotification = {
  id: 1,
  user_id: 'u1',
  kind: 'order_accepted',
  params: { order_id: 9, store_name: 'Ali Traders' },
};

describe('buildMessages', () => {
  it('makes one message per phone, each in that phone’s language', () => {
    const messages = buildMessages(notification, [
      { token: 'ExponentPushToken[a]', language: 'en' },
      { token: 'ExponentPushToken[b]', language: 'ur' },
    ]);
    expect(messages.map((m) => m.to)).toEqual(['ExponentPushToken[a]', 'ExponentPushToken[b]']);
    expect(messages[0]?.title).toBe('Ali Traders accepted your order');
    expect(messages[1]?.title).toContain('Ali Traders');
    expect(messages[1]?.title).not.toBe(messages[0]?.title);
  });

  it('carries only what the app needs to open the right order', () => {
    const [message] = buildMessages(notification, [
      { token: 'ExponentPushToken[a]', language: 'en' },
    ]);
    expect(message?.data).toEqual({ kind: 'order_accepted', orderId: 9 });
    expect(message?.channelId).toBe('orders');
    expect(message?.priority).toBe('high');
  });

  it('falls back to English for a language it does not know', () => {
    const [message] = buildMessages(notification, [
      { token: 'ExponentPushToken[a]', language: 'fr' },
    ]);
    expect(message?.title).toBe('Ali Traders accepted your order');
  });

  it('sends nothing for an unknown kind, unreadable parameters or a person without a phone', () => {
    const phone = [{ token: 'ExponentPushToken[a]', language: 'en' }];
    expect(buildMessages({ ...notification, kind: 'order_shipped' }, phone)).toEqual([]);
    expect(buildMessages({ ...notification, params: { order_id: 'x' } }, phone)).toEqual([]);
    expect(buildMessages(notification, [])).toEqual([]);
  });
});

describe('ttlFor', () => {
  it('lets a delivery alert expire quickly and order news last for hours', () => {
    expect(ttlFor('delivery_available')).toBe(600);
    expect(ttlFor('order_ready')).toBe(6 * 60 * 60);
  });
});

describe('chunk', () => {
  it('splits into batches Expo accepts', () => {
    const items = Array.from({ length: EXPO_BATCH_SIZE * 2 + 1 }, (_, i) => i);
    const batches = chunk(items, EXPO_BATCH_SIZE);
    expect(batches.map((b) => b.length)).toEqual([100, 100, 1]);
    expect(batches.flat()).toEqual(items);
  });

  it('gives no batches for nothing', () => {
    expect(chunk([], 100)).toEqual([]);
  });
});

describe('readTickets', () => {
  it('reads tickets in the order the messages were sent', () => {
    const outcomes = readTickets(
      {
        data: [
          { status: 'ok', id: 'x' },
          { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } },
          { status: 'error', message: 'big', details: { error: 'MessageTooBig' } },
        ],
      },
      3,
    );
    expect(outcomes).toEqual([
      { ok: true },
      { ok: false, error: 'DeviceNotRegistered', deadToken: true },
      { ok: false, error: 'MessageTooBig', deadToken: false },
    ]);
  });

  it('fails every message when the whole request failed, using Expo’s reason', () => {
    expect(readTickets({ errors: [{ code: 'PUSH_TOO_MANY_EXPERIENCE_IDS' }] }, 2)).toEqual([
      { ok: false, error: 'PUSH_TOO_MANY_EXPERIENCE_IDS', deadToken: false },
      { ok: false, error: 'PUSH_TOO_MANY_EXPERIENCE_IDS', deadToken: false },
    ]);
  });

  it.each([null, 'oops', {}, { data: 'x' }, { data: [{ status: 'ok' }] }])(
    'treats an unexpected reply as failure, not as delivered: %j',
    (response) => {
      const outcomes = readTickets(response, 2);
      expect(outcomes).toHaveLength(2);
      expect(outcomes.every((o) => !o.ok)).toBe(true);
    },
  );
});

describe('judge', () => {
  const messages = buildMessages(notification, [
    { token: 'ExponentPushToken[a]', language: 'en' },
    { token: 'ExponentPushToken[b]', language: 'en' },
  ]);

  it('is done when there was nothing to send', () => {
    expect(judge([], [])).toEqual({ done: true, error: null, deadTokens: [] });
  });

  it('is done when at least one phone accepted it, and still reports dead tokens', () => {
    expect(
      judge(messages, [{ ok: false, error: 'DeviceNotRegistered', deadToken: true }, { ok: true }]),
    ).toEqual({ done: true, error: null, deadTokens: ['ExponentPushToken[a]'] });
  });

  it('is not done, with the reason, when every phone failed for a reason that may pass', () => {
    expect(
      judge(messages, [
        { ok: false, error: 'bad_response', deadToken: false },
        { ok: false, error: 'bad_response', deadToken: false },
      ]),
    ).toEqual({ done: false, error: 'bad_response', deadTokens: [] });
  });

  it('is done when every phone is dead: nobody is left to retry', () => {
    expect(
      judge(messages, [
        { ok: false, error: 'DeviceNotRegistered', deadToken: true },
        { ok: false, error: 'DeviceNotRegistered', deadToken: true },
      ]),
    ).toEqual({
      done: true,
      error: null,
      deadTokens: ['ExponentPushToken[a]', 'ExponentPushToken[b]'],
    });
  });
});
