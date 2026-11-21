// The words of every notification, in English and Urdu. Pure functions (no Deno, no network) so they
// can be unit tested with the app's tests (`npm test`). The queue stores only `kind` and a few
// parameters; the text is written here, in the language of each phone that will receive it.

export const NOTIFICATION_KINDS = [
  'order_placed',
  'order_accepted',
  'order_rejected',
  'order_ready',
  'order_picked_up',
  'order_delivered',
  'order_cancelled',
  'delivery_available',
  'delivery_cancelled',
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type PushLanguage = 'en' | 'ur';

export function isNotificationKind(value: unknown): value is NotificationKind {
  return typeof value === 'string' && (NOTIFICATION_KINDS as readonly string[]).includes(value);
}

export function isPushLanguage(value: unknown): value is PushLanguage {
  return value === 'en' || value === 'ur';
}

/** What a notification may mention: the order number and the store's name. Never an address or phone. */
export interface MessageParams {
  orderId: number;
  storeName: string;
}

export interface PushText {
  title: string;
  body: string;
}

/**
 * Reads the `params` column of a queued row. It is data from the database, so it is checked rather
 * than trusted; anything unexpected gives null and the notification is not sent.
 */
export function readParams(raw: unknown): MessageParams | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { order_id: orderId, store_name: storeName } = raw as Record<string, unknown>;
  if (typeof orderId !== 'number' || !Number.isInteger(orderId) || orderId <= 0) return null;
  if (typeof storeName !== 'string') return null;
  return { orderId, storeName };
}

type Template = (params: MessageParams) => PushText;

const TEMPLATES: Record<PushLanguage, Record<NotificationKind, Template>> = {
  en: {
    order_placed: ({ orderId }) => ({
      title: `New order #${orderId}`,
      body: 'A customer just ordered. Open the app to accept it.',
    }),
    order_accepted: ({ storeName }) => ({
      title: `${storeName} accepted your order`,
      body: 'They are getting it ready.',
    }),
    order_rejected: ({ storeName }) => ({
      title: `${storeName} could not take your order`,
      body: 'Open the app to see what happened.',
    }),
    order_ready: ({ storeName }) => ({
      title: 'Your order is ready',
      body: `A rider will collect it from ${storeName}.`,
    }),
    order_picked_up: ({ storeName }) => ({
      title: 'Your order is on the way',
      body: `The rider has picked it up from ${storeName}.`,
    }),
    order_delivered: ({ storeName }) => ({
      title: 'Order delivered',
      body: `Your order from ${storeName} has arrived.`,
    }),
    order_cancelled: ({ storeName }) => ({
      title: 'Order cancelled',
      body: `${storeName} cancelled your order.`,
    }),
    delivery_available: ({ storeName }) => ({
      title: 'New delivery nearby',
      body: `${storeName} has an order to deliver. Open the app to accept it.`,
    }),
    delivery_cancelled: ({ storeName, orderId }) => ({
      title: 'Delivery cancelled',
      body: `${storeName} cancelled order #${orderId}. You are free to take another delivery.`,
    }),
  },
  ur: {
    order_placed: ({ orderId }) => ({
      title: `نیا آرڈر #${orderId}`,
      body: 'ایک گاہک نے آرڈر دیا ہے۔ اسے قبول کرنے کے لیے ایپ کھولیں۔',
    }),
    order_accepted: ({ storeName }) => ({
      title: `${storeName} نے آپ کا آرڈر قبول کر لیا`,
      body: 'وہ اسے تیار کر رہے ہیں۔',
    }),
    order_rejected: ({ storeName }) => ({
      title: `${storeName} آپ کا آرڈر نہیں لے سکے`,
      body: 'کیا ہوا، یہ دیکھنے کے لیے ایپ کھولیں۔',
    }),
    order_ready: ({ storeName }) => ({
      title: 'آپ کا آرڈر تیار ہے',
      body: `رائیڈر اسے ${storeName} سے لے جائے گا۔`,
    }),
    order_picked_up: ({ storeName }) => ({
      title: 'آپ کا آرڈر راستے میں ہے',
      body: `رائیڈر نے اسے ${storeName} سے لے لیا ہے۔`,
    }),
    order_delivered: ({ storeName }) => ({
      title: 'آرڈر پہنچ گیا',
      body: `${storeName} سے آپ کا آرڈر پہنچ گیا ہے۔`,
    }),
    order_cancelled: ({ storeName }) => ({
      title: 'آرڈر منسوخ ہو گیا',
      body: `${storeName} نے آپ کا آرڈر منسوخ کر دیا۔`,
    }),
    delivery_available: ({ storeName }) => ({
      title: 'قریب نئی ڈیلیوری',
      body: `${storeName} کا ایک آرڈر ڈیلیوری کے لیے ہے۔ قبول کرنے کے لیے ایپ کھولیں۔`,
    }),
    delivery_cancelled: ({ storeName, orderId }) => ({
      title: 'ڈیلیوری منسوخ',
      body: `${storeName} نے آرڈر #${orderId} منسوخ کر دیا۔ آپ دوسری ڈیلیوری لے سکتے ہیں۔`,
    }),
  },
};

export function buildPushText(
  kind: NotificationKind,
  language: PushLanguage,
  params: MessageParams,
): PushText {
  return TEMPLATES[language][kind](params);
}
