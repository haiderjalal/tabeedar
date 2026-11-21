import type { catalog as englishCatalog } from '../en/catalog';

/** Urdu strings for the store owner's products and categories. First draft: a native speaker should review. */
export const catalog: typeof englishCatalog = {
  list: {
    loadError: 'ہم آپ کی مصنوعات لوڈ نہیں کر سکے۔',
    emptyTitle: 'ابھی کوئی مصنوعات نہیں',
    emptyBody: 'اپنی پہلی پروڈکٹ شامل کریں تاکہ گاہک اسے آرڈر کر سکیں۔',
    addProduct: 'پروڈکٹ شامل کریں',
    manageCategories: 'زمرے',
    uncategorised: 'بغیر زمرہ',
    inStock: 'اسٹاک میں ہے',
    outOfStock: 'اسٹاک ختم',
    stockSwitch: 'اسٹاک میں ہے: {{name}}',
    editProduct: '{{name}} میں تبدیلی',
    stockFailed: 'ہم اسٹاک تبدیل نہیں کر سکے۔ براہِ کرم دوبارہ کوشش کریں۔',
  },
  product: {
    form: {
      photo: 'پروڈکٹ کی تصویر',
      name: { label: 'پروڈکٹ کا نام' },
      description: {
        label: 'تفصیل (اختیاری)',
        hint: 'سائز، برانڈ، یا کوئی بھی بات جو گاہک کو معلوم ہونی چاہیے',
      },
      price: { label: 'قیمت (روپے)', hint: 'روپوں میں، مثلاً 250 یا 99.50' },
      category: { label: 'زمرہ', none: 'بغیر زمرہ' },
      inStock: 'اسٹاک میں ہے',
      inStockHint:
        'اسٹاک ختم ہو جائے تو اسے آف کر دیں۔ گاہک پروڈکٹ دیکھ سکیں گے لیکن آرڈر نہیں کر سکیں گے۔',
      save: 'پروڈکٹ محفوظ کریں',
      delete: 'پروڈکٹ حذف کریں',
    },
    deleteConfirm: {
      title: 'یہ پروڈکٹ حذف کریں؟',
      body: '“{{name}}” آپ کی دکان سے ہٹا دی جائے گی۔ پرانے آرڈر متاثر نہیں ہوں گے۔',
      confirm: 'پروڈکٹ حذف کریں',
      keep: 'پروڈکٹ رکھیں',
    },
    notFoundTitle: 'پروڈکٹ نہیں ملی',
    notFoundBody: 'یہ پروڈکٹ اب موجود نہیں۔',
  },
  categories: {
    loadError: 'ہم آپ کے زمرے لوڈ نہیں کر سکے۔',
    emptyTitle: 'ابھی کوئی زمرہ نہیں',
    emptyBody: 'زمرے آپ کی دکان کے صفحے پر مصنوعات کو گروپ کرتے ہیں، مثلاً ڈیری یا اسنیکس۔',
    newLabel: 'نیا زمرہ',
    nameLabel: 'زمرے کا نام',
    add: 'شامل کریں',
    save: 'محفوظ کریں',
    edit: 'نام بدلیں',
    editLabel: '{{name}} کا نام بدلیں',
    deleteLabel: '{{name}} حذف کریں',
    deleteConfirm: {
      title: 'یہ زمرہ حذف کریں؟',
      body: '“{{name}}” ہٹا دیا جائے گا۔ اس کی مصنوعات آپ کی دکان میں بغیر زمرے کے رہیں گی۔',
      confirm: 'زمرہ حذف کریں',
      keep: 'زمرہ رکھیں',
    },
  },
  validation: {
    categoryNameRequired: 'براہِ کرم زمرے کا نام درج کریں۔',
    productNameRequired: 'براہِ کرم پروڈکٹ کا نام درج کریں۔',
    priceInvalid: 'براہِ کرم روپوں میں قیمت درج کریں، مثلاً 250 یا 99.50۔',
    tooLong: 'یہ بہت لمبا ہے (زیادہ سے زیادہ {{max}} حروف)۔',
  },
  errors: {
    duplicateName: 'آپ کا اس نام کا زمرہ پہلے سے موجود ہے۔',
    network: 'انٹرنیٹ نہیں ہے۔ اپنا انٹرنیٹ دیکھیں اور دوبارہ کوشش کریں۔',
    generic: 'کچھ غلط ہو گیا۔ براہِ کرم دوبارہ کوشش کریں۔',
  },
};
