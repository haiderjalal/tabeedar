import type { storeOrders as englishStoreOrders } from '../en/store-orders';

/** Urdu strings for the orders a store receives. First draft: a native speaker should review. */
export const storeOrders: typeof englishStoreOrders = {
  tabs: {
    active: 'جاری',
    history: 'پچھلے',
  },
  list: {
    emptyActiveTitle: 'کوئی جاری آرڈر نہیں',
    emptyActiveBody: 'نئے آرڈر خود بخود یہاں آ جاتے ہیں۔ ریفریش کرنے کی ضرورت نہیں۔',
    emptyHistoryTitle: 'ابھی کوئی پچھلا آرڈر نہیں',
    emptyHistoryBody: 'ڈیلیور ہوئے، مسترد اور منسوخ آرڈر یہاں محفوظ رہتے ہیں۔',
    placedAt: 'آرڈر کا وقت {{date}}',
    forCustomer: '{{name}} کے لیے',
    loadError: 'ہم آپ کے آرڈر لوڈ نہیں کر سکے۔',
  },
  status: {
    placed: 'نیا آرڈر',
    accepted: 'قبول کر لیا',
    preparing: 'تیار ہو رہا ہے',
    ready: 'پک اپ کے لیے تیار',
    picked_up: 'رائیڈر لے گیا',
    delivered: 'ڈیلیور ہو گیا',
    rejected: 'مسترد',
    cancelled: 'منسوخ',
  },
  detail: {
    loadError: 'ہم یہ آرڈر لوڈ نہیں کر سکے۔',
    notFoundTitle: 'آرڈر نہیں ملا',
    notFoundBody: 'یہ آرڈر موجود نہیں، یا کسی اور دکان کا ہے۔',
    customer: 'گاہک',
    call: '{{name}} کو کال کریں',
    address: 'ڈیلیوری کا پتہ',
    customerNote: 'گاہک کا نوٹ',
    rider: 'رائیڈر',
    riderAssigned: 'ایک رائیڈر نے ڈیلیوری قبول کر لی',
    riderWaiting: 'آرڈر قبول کرتے ہی قریبی رائیڈرز کو اطلاع مل جاتی ہے۔',
    riderRequested: 'کسی رائیڈر کے ڈیلیوری قبول کرنے کا انتظار ہے۔',
  },
  actions: {
    accepted: 'آرڈر قبول کریں',
    rejected: 'آرڈر مسترد کریں',
    preparing: 'تیاری شروع کریں',
    ready: 'پک اپ کے لیے تیار کریں',
    cancelled: 'آرڈر منسوخ کریں',
  },
  note: {
    label: 'وجہ (اختیاری)',
    hint: 'گاہک اسے آرڈر کی تاریخ میں دیکھے گا۔',
    rejected: {
      title: 'یہ آرڈر مسترد کریں؟',
      body: 'گاہک کو بتایا جائے گا کہ آپ یہ آرڈر نہیں لے سکے۔',
      confirm: 'آرڈر مسترد کریں',
    },
    cancelled: {
      title: 'یہ آرڈر منسوخ کریں؟',
      body: 'گاہک کو بتایا جائے گا کہ آرڈر منسوخ ہو گیا۔',
      confirm: 'آرڈر منسوخ کریں',
    },
    back: 'واپس جائیں',
  },
  errors: {
    invalidTransition:
      'یہ آرڈر بدل چکا ہے، مثلاً گاہک نے اسے منسوخ کر دیا۔ تازہ ترین حالت دکھائی جا رہی ہے۔',
    orderNotFound: 'ہم یہ آرڈر نہیں ڈھونڈ سکے۔',
    network: 'انٹرنیٹ نہیں ہے۔ اپنا انٹرنیٹ دیکھیں اور دوبارہ کوشش کریں۔',
    generic: 'کچھ غلط ہو گیا۔ براہِ کرم دوبارہ کوشش کریں۔',
  },
};
