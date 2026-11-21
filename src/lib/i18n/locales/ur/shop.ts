import type { shop as englishShop } from '../en/shop';

/** Urdu strings for the store owner's own store. First draft: a native speaker should review. */
export const shop: typeof englishShop = {
  loadError: 'ہم آپ کی دکان لوڈ نہیں کر سکے۔',
  setup: {
    title: 'اپنی دکان بنائیں',
    intro:
      'گاہکوں کو اپنی دکان کے بارے میں بتائیں۔ محفوظ کرنے کے بعد آپ لوگو اور کور تصویر شامل کر سکتے ہیں۔',
    create: 'میری دکان بنائیں',
  },
  form: {
    name: { label: 'دکان کا نام' },
    description: {
      label: 'تفصیل (اختیاری)',
      hint: 'آپ کیا بیچتے ہیں، ایک دو جملوں میں',
    },
    phone: { label: 'دکان کا فون (اختیاری)' },
    addressLine: { label: 'گلی کا پتہ', hint: 'دکان نمبر، گلی، مارکیٹ' },
    area: { label: 'علاقہ (اختیاری)', hint: 'مثلاً ایف-7' },
    city: { label: 'شہر' },
    locationHint: 'ڈیلیوری فیس اور رائیڈر کا فاصلہ اسی مقام سے ناپا جاتا ہے۔',
    logo: 'لوگو',
    cover: 'کور تصویر',
    save: 'تبدیلیاں محفوظ کریں',
  },
  my: {
    openLabel: 'آرڈر قبول کر رہے ہیں',
    openHint: 'گاہک صرف اسی وقت آرڈر دے سکتے ہیں جب یہ آن ہو۔ دکان بند ہو تو اسے آف کر دیں۔',
    open: 'کھلی ہے',
    closed: 'بند ہے',
    edit: 'دکان کی تفصیل میں تبدیلی',
    suspendedTitle: 'آپ کی دکان معطل ہے',
    suspendedBody: 'گاہک اسے ابھی نہیں دیکھ سکتے۔ براہِ کرم Tabeedar سپورٹ سے رابطہ کریں۔',
  },
  validation: {
    nameRequired: 'براہِ کرم دکان کا نام درج کریں۔',
    addressRequired: 'براہِ کرم گلی کا پتہ درج کریں۔',
    cityRequired: 'براہِ کرم شہر درج کریں۔',
    phoneInvalid: 'براہِ کرم درست فون نمبر درج کریں، یا خالی چھوڑ دیں۔',
    tooLong: 'یہ بہت لمبا ہے (زیادہ سے زیادہ {{max}} حروف)۔',
    locationRequired: 'براہِ کرم نقشے پر مقام طے کریں۔',
  },
  errors: {
    alreadyHasStore: 'اس اکاؤنٹ کی پہلے ہی ایک دکان ہے۔',
    network: 'انٹرنیٹ نہیں ہے۔ اپنا انٹرنیٹ دیکھیں اور دوبارہ کوشش کریں۔',
    generic: 'ہم آپ کی دکان محفوظ نہیں کر سکے۔ براہِ کرم دوبارہ کوشش کریں۔',
  },
};
