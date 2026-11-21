import type { cart as englishCart } from '../en/cart';

/** Urdu strings for the shopping cart. First draft: a native speaker should review. */
export const cart: typeof englishCart = {
  emptyTitle: 'آپ کی ٹوکری خالی ہے',
  emptyBody: 'شروع کرنے کے لیے کسی دکان سے چیزیں شامل کریں۔',
  browse: 'دکانیں دیکھیں',
  from: '{{store}} سے',
  subtotal: 'ذیلی کل',
  deliveryNote: 'ڈیلیوری فیس چیک آؤٹ پر شامل ہوگی۔',
  checkout: 'چیک آؤٹ',
  clear: 'ٹوکری خالی کریں',
  increase: 'ایک اور {{name}} شامل کریں',
  decrease: 'ایک {{name}} کم کریں',
  quantity: '{{name}} کی مقدار: {{count}}',
  unavailable: 'اب دستیاب نہیں۔ جاری رکھنے کے لیے اسے ہٹا دیں۔',
  priceChanged: 'اب قیمت {{price}} ہے۔',
  replace: {
    title: 'نئی ٹوکری شروع کریں؟',
    body: 'آپ کی ٹوکری میں {{store}} کی چیزیں ہیں۔ اسے شامل کرنے سے وہ خالی ہو جائے گی، کیونکہ ایک آرڈر صرف ایک دکان سے ہو سکتا ہے۔',
    confirm: 'نئی ٹوکری شروع کریں',
  },
  clearConfirm: {
    title: 'ٹوکری خالی کریں؟',
    body: 'تمام اشیا ہٹا دی جائیں گی۔',
    confirm: 'ٹوکری خالی کریں',
  },
};
