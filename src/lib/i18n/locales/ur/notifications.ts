import type { notifications as englishNotifications } from '../en/notifications';

/** Urdu strings for notifications on the phone. First draft: a native speaker should review. */
export const notifications: typeof englishNotifications = {
  channelName: 'آرڈر کی اطلاعات',
  off: {
    title: 'اطلاعات بند ہیں',
    body: 'انہیں فون کی سیٹنگز میں آن کریں، تاکہ ایپ بند ہونے پر بھی آپ کو آرڈرز کا فوراً پتہ چلے۔',
    action: 'سیٹنگز کھولیں',
  },
};
