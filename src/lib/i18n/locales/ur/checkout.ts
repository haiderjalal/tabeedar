import type { checkout as englishCheckout } from '../en/checkout';

/** Urdu strings for checkout. First draft: a native speaker should review. */
export const checkout: typeof englishCheckout = {
  deliverTo: 'ڈیلیوری کا پتہ',
  change: 'تبدیل کریں',
  noAddress: 'جاری رکھنے کے لیے ڈیلیوری کا پتہ منتخب کریں۔',
  addAddress: 'پتہ شامل کریں',
  recipient: {
    title: 'یہ آرڈر کون وصول کرے گا؟',
    forMe: 'میں',
    forSomeone: 'کوئی اور',
    name: { label: 'وصول کنندہ کا نام' },
    phone: { label: 'وصول کنندہ کا فون' },
  },
  notes: {
    label: 'دکان کے لیے نوٹ (اختیاری)',
    hint: 'کوئی بھی بات جو دکان یا رائیڈر کو معلوم ہونی چاہیے',
  },
  summary: {
    title: 'آرڈر کا خلاصہ',
    subtotal: 'ذیلی کل',
    deliveryFee: 'ڈیلیوری فیس',
    total: 'کل',
    distance: 'ڈیلیوری کا فاصلہ: {{distance}} {{unit}}',
    calculating: 'حساب ہو رہا ہے…',
    feeUnavailable: 'ہم ڈیلیوری فیس کا حساب نہیں کر سکے۔ اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
    payment: 'آرڈر پہنچنے پر آپ نقد ادائیگی کریں گے۔',
  },
  place: 'آرڈر دیں',
  cartProblem: 'آپ کی ٹوکری کی کچھ اشیا اب دستیاب نہیں۔ جاری رکھنے کے لیے ٹوکری دیکھیں۔',
  reviewCart: 'ٹوکری دیکھیں',
  validation: {
    nameRequired: 'براہِ کرم وصول کنندہ کا نام درج کریں۔',
    phoneInvalid: 'براہِ کرم درست فون نمبر درج کریں۔',
    tooLong: 'یہ بہت لمبا ہے (زیادہ سے زیادہ {{max}} حروف)۔',
  },
  errors: {
    storeUnavailable: 'یہ دکان بند ہے یا اب دستیاب نہیں۔',
    productUnavailable: 'کچھ اشیا اب دستیاب نہیں۔ براہِ کرم اپنی ٹوکری دیکھیں۔',
    invalidItems: 'آپ کی ٹوکری پڑھی نہیں جا سکی۔ براہِ کرم اسے دیکھ کر دوبارہ کوشش کریں۔',
    invalidLocation: 'ڈیلیوری کا مقام غلط لگ رہا ہے۔ براہِ کرم اپنا پتہ چیک کریں۔',
    network: 'انٹرنیٹ کنکشن نہیں ہے۔ اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
    generic: 'ہم آپ کا آرڈر نہیں دے سکے۔ براہِ کرم دوبارہ کوشش کریں۔',
  },
};
