import type { navigation as englishNavigation } from '../en/navigation';

/** Urdu titles of tabs and screens. First draft: a native speaker should review. */
export const navigation: typeof englishNavigation = {
  tabs: {
    stores: 'دکانیں',
    cart: 'ٹوکری',
    orders: 'آرڈرز',
    account: 'اکاؤنٹ',
    catalog: 'مصنوعات',
    myStore: 'میری دکان',
    offers: 'پیشکشیں',
    deliveries: 'ڈیلیوریاں',
  },
  screens: {
    store: 'دکان',
    checkout: 'چیک آؤٹ',
    addresses: 'میرے پتے',
    newAddress: 'نیا پتہ',
    editAddress: 'پتہ تبدیل کریں',
    order: 'آرڈر',
    setupStore: 'اپنی دکان بنائیں',
    editStore: 'دکان کی تفصیل میں تبدیلی',
    categories: 'زمرے',
    newProduct: 'نئی پروڈکٹ',
    editProduct: 'پروڈکٹ میں تبدیلی',
    riderAccount: 'رائیڈر اکاؤنٹ',
    delivery: 'ڈیلیوری',
  },
};
