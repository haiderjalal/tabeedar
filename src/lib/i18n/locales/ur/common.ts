import type { common as englishCommon } from '../en/common';

/**
 * Urdu strings. Typed against the English shape, so a missing or misspelled key is a
 * compile error. A native speaker should review all copy before launch.
 */
export const common: typeof englishCommon = {
  app: {
    // The brand name stays in Latin script until an Urdu wordmark is designed.
    name: 'Tabeedar',
    tagline: 'آپ کی پسندیدہ دکانیں، آپ کے دروازے تک۔',
  },
  language: {
    label: 'زبان',
  },
  actions: {
    retry: 'دوبارہ کوشش کریں',
    cancel: 'منسوخ کریں',
    confirm: 'تصدیق کریں',
    save: 'محفوظ کریں',
    delete: 'حذف کریں',
    edit: 'ترمیم کریں',
    clearSearch: 'تلاش صاف کریں',
  },
  units: {
    m: 'میٹر',
    km: 'کلومیٹر',
  },
  loading: 'لوڈ ہو رہا ہے',
  errors: {
    generic: 'کچھ غلط ہو گیا۔ براہِ کرم دوبارہ کوشش کریں۔',
    network: 'انٹرنیٹ کنکشن نہیں ہے۔ اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
  },
};
