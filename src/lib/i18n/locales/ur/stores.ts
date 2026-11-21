import type { stores as englishStores } from '../en/stores';

/** Urdu strings for finding stores and looking inside one. First draft: a native speaker should review. */
export const stores: typeof englishStores = {
  home: {
    deliveringTo: 'ڈیلیوری کا پتہ',
    change: 'تبدیل کریں',
    searchPlaceholder: 'دکانیں اور مصنوعات تلاش کریں',
    searchLabel: 'دکانیں اور مصنوعات تلاش کریں',
    noAddressTitle: 'ہم ڈیلیوری کہاں کریں؟',
    noAddressBody: 'اپنے قریب کی دکانیں دیکھنے کے لیے ڈیلیوری کا پتہ شامل کریں۔',
    addAddress: 'پتہ شامل کریں',
    emptyNearbyTitle: 'ابھی آپ کے قریب کوئی دکان نہیں',
    emptyNearbyBody: 'اس پتے کے قریب کوئی دکان درج نہیں۔ کوئی دوسرا پتہ آزما کر دیکھیں۔',
    emptySearchTitle: 'کچھ نہیں ملا',
    emptySearchBody: '“{{query}}” سے ملتی کوئی دکان یا چیز نہیں ملی۔',
    loadError: 'ہم دکانیں لوڈ نہیں کر سکے۔',
  },
  card: {
    open: 'کھلی ہے',
    closed: 'بند ہے',
    away: '{{distance}} {{unit}} دور',
    has: 'دستیاب: {{products}}',
    openStore: '{{name}} کھولیں',
  },
  store: {
    closedBanner: 'یہ دکان ابھی بند ہے۔ آپ دیکھ سکتے ہیں، لیکن آرڈر نہیں کر سکتے۔',
    outOfStock: 'ختم ہو گیا',
    add: 'شامل کریں',
    addLabel: '{{name}} ٹوکری میں شامل کریں',
    otherItems: 'دیگر اشیا',
    noProducts: 'اس دکان نے ابھی کوئی مصنوعات شامل نہیں کیں۔',
    notFoundTitle: 'دکان نہیں ملی',
    notFoundBody: 'ممکن ہے اسے ہٹا دیا گیا ہو یا وہ ابھی دستیاب نہ ہو۔',
    viewCart: 'ٹوکری دیکھیں',
    cartSummary: 'اشیا: {{count}}',
    loadError: 'ہم یہ دکان لوڈ نہیں کر سکے۔',
  },
};
