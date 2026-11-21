import type { media as englishMedia } from '../en/media';

/** Urdu strings for choosing and uploading store pictures. First draft: a native speaker should review. */
export const media: typeof englishMedia = {
  choose: 'تصویر منتخب کریں',
  change: 'تصویر تبدیل کریں',
  remove: 'ہٹائیں',
  chooseLabel: '{{name}} منتخب کریں',
  changeLabel: '{{name}} تبدیل کریں',
  removeLabel: '{{name}} ہٹائیں',
  errors: {
    too_large: 'یہ تصویر بہت بڑی ہے۔ براہِ کرم کوئی چھوٹی تصویر منتخب کریں۔',
    unreadable: 'ہم یہ تصویر نہیں پڑھ سکے۔ براہِ کرم کوئی اور تصویر منتخب کریں۔',
    upload_failed:
      'ہم تصویر اپ لوڈ نہیں کر سکے۔ براہِ کرم اپنا انٹرنیٹ دیکھیں اور دوبارہ کوشش کریں۔',
  },
};
