import type { addresses as englishAddresses } from '../en/addresses';

/** Urdu strings for saved delivery addresses. First draft: a native speaker should review. */
export const addresses: typeof englishAddresses = {
  list: {
    emptyTitle: 'کوئی محفوظ پتہ نہیں',
    emptyBody: 'وہ جگہ شامل کریں جہاں آپ اپنے آرڈر منگوانا چاہتے ہیں۔',
    add: 'پتہ شامل کریں',
    default: 'ڈیفالٹ',
    selected: 'یہاں ڈیلیوری ہوگی',
    select: 'یہاں ڈیلیوری کریں',
    forSomeone: '{{name}} کے لیے',
    loadError: 'ہم آپ کے پتے لوڈ نہیں کر سکے۔',
    deleteConfirm: {
      title: 'یہ پتہ حذف کریں؟',
      body: '“{{label}}” ہٹا دیا جائے گا۔ آپ کے پرانے آرڈر متاثر نہیں ہوں گے۔',
    },
    deleteFailed: 'ہم پتہ حذف نہیں کر سکے۔ براہِ کرم دوبارہ کوشش کریں۔',
  },
  form: {
    label: { label: 'نام', hint: 'مثلاً گھر یا دفتر' },
    recipientName: {
      label: 'وصول کنندہ کا نام (اختیاری)',
      hint: 'اگر پتہ کسی اور کے لیے ہے تو یہ بھریں',
    },
    recipientPhone: { label: 'وصول کنندہ کا فون (اختیاری)' },
    addressLine: { label: 'گلی کا پتہ', hint: 'مکان، گلی، عمارت' },
    area: { label: 'علاقہ (اختیاری)', hint: 'مثلاً ایف-7' },
    city: { label: 'شہر' },
    instructions: {
      label: 'ڈیلیوری کی ہدایات (اختیاری)',
      hint: 'گیٹ کا رنگ، نشانی، منزل',
    },
    locationHint: 'ڈیلیوری فیس معلوم کرنے اور آپ کے قریب کی دکانیں ڈھونڈنے کے لیے۔',
    isDefault: 'اسے میرا ڈیفالٹ پتہ بنائیں',
    save: 'پتہ محفوظ کریں',
    saveFailed: 'ہم پتہ محفوظ نہیں کر سکے۔ براہِ کرم دوبارہ کوشش کریں۔',
  },
  validation: {
    labelRequired: 'براہِ کرم اس پتے کو کوئی نام دیں۔',
    addressRequired: 'براہِ کرم گلی کا پتہ درج کریں۔',
    cityRequired: 'براہِ کرم شہر درج کریں۔',
    phoneInvalid: 'براہِ کرم درست فون نمبر درج کریں، یا خالی چھوڑ دیں۔',
    tooLong: 'یہ بہت لمبا ہے (زیادہ سے زیادہ {{max}} حروف)۔',
    locationRequired: 'براہِ کرم نقشے پر مقام طے کریں۔',
  },
};
