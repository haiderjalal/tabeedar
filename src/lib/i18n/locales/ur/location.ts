import type { location as englishLocation } from '../en/location';

/** Urdu strings for setting a map position. First draft: a native speaker should review. */
export const location: typeof englishLocation = {
  title: 'نقشے پر مقام',
  useCurrent: 'میرا موجودہ مقام استعمال کریں',
  set: 'مقام محفوظ: {{latitude}}، {{longitude}}',
  notSet: 'ابھی کوئی مقام نہیں۔',
  pasteLabel: 'یا گوگل میپس کا لنک یا کوآرڈینیٹس پیسٹ کریں',
  pasteHint:
    'ایسی جگہ کے لیے جہاں آپ ابھی موجود نہیں: واٹس ایپ یا گوگل میپس سے اس کا مقام شیئر کریں، پھر لنک یہاں پیسٹ کریں۔',
  apply: 'یہ مقام استعمال کریں',
  pasteInvalid:
    'اس متن میں ہمیں کوئی مقام نہیں ملا۔ پورا لنک پیسٹ کریں، یا کوآرڈینیٹس جیسے 33.7080, 73.0420۔',
  denied: 'مقام کی رسائی بند ہے۔ اسے فون کی سیٹنگز میں اجازت دیں، یا لنک پیسٹ کریں۔',
  unavailable: 'آپ کا مقام ابھی دستیاب نہیں۔ دوبارہ کوشش کریں، یا لنک پیسٹ کریں۔',
};
