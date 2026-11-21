import type { auth as englishAuth } from '../en/auth';

/**
 * Urdu strings for signing in, signing up and the signed-in account. Typed against the English
 * shape, so a missing key is a compile error. First draft: a native speaker should review.
 */
export const auth: typeof englishAuth = {
  roles: {
    customer: {
      title: 'آرڈر کریں',
      description: 'دکانیں دیکھیں اور اپنی چیزیں گھر منگوائیں۔',
    },
    store: {
      title: 'میری دکان ہے',
      description: 'اپنی مصنوعات بیچیں اور آنے والے آرڈر سنبھالیں۔',
    },
    rider: {
      title: 'ڈیلیوری کریں',
      description:
        'قریبی دکانوں کے آرڈر پہنچائیں۔ نئے رائیڈرز کو شروع کرنے سے پہلے منظور کیا جاتا ہے۔',
    },
  },
  signIn: {
    title: 'واپسی پر خوش آمدید',
    subtitle: 'جاری رکھنے کے لیے سائن اِن کریں۔',
    submit: 'سائن اِن کریں',
    noAccount: 'Tabeedar پر نئے ہیں؟',
    goToSignUp: 'اکاؤنٹ بنائیں',
  },
  signUp: {
    title: 'اپنا اکاؤنٹ بنائیں',
    subtitle: 'بتائیں کہ آپ Tabeedar کیسے استعمال کریں گے۔',
    roleLabel: 'اکاؤنٹ کی قسم',
    submit: 'اکاؤنٹ بنائیں',
    haveAccount: 'پہلے سے اکاؤنٹ ہے؟',
    goToSignIn: 'سائن اِن کریں',
    confirmEmail: {
      title: 'اپنا ای میل دیکھیں',
      body: 'ہم نے {{email}} پر تصدیقی لنک بھیجا ہے۔ اسے کھولیں، پھر سائن اِن کریں۔',
      goToSignIn: 'سائن اِن پر جائیں',
    },
  },
  fields: {
    fullName: { label: 'پورا نام' },
    phone: { label: 'فون نمبر', hint: 'مثال: 0300 1234567' },
    email: { label: 'ای میل' },
    password: {
      label: 'پاس ورڈ',
      hint: 'کم از کم {{min}} حروف',
      show: 'دکھائیں',
      hide: 'چھپائیں',
    },
  },
  validation: {
    fullNameRequired: 'براہِ کرم اپنا نام درج کریں۔',
    fullNameTooLong: 'نام بہت لمبا ہے (زیادہ سے زیادہ {{max}} حروف)۔',
    phoneInvalid: 'براہِ کرم درست فون نمبر درج کریں۔',
    emailInvalid: 'براہِ کرم درست ای میل درج کریں۔',
    passwordRequired: 'براہِ کرم اپنا پاس ورڈ درج کریں۔',
    passwordTooShort: 'پاس ورڈ کم از کم {{min}} حروف کا ہونا چاہیے۔',
    passwordTooLong: 'پاس ورڈ بہت لمبا ہے (زیادہ سے زیادہ {{max}} حروف)۔',
  },
  errors: {
    invalidCredentials: 'ای میل یا پاس ورڈ غلط ہے۔',
    emailNotConfirmed: 'پہلے اپنا ای میل تصدیق کریں۔ اپنے ان باکس میں لنک دیکھیں۔',
    emailTaken: 'اس ای میل سے اکاؤنٹ پہلے سے موجود ہے۔ سائن اِن کر کے دیکھیں۔',
    weakPassword: 'براہِ کرم زیادہ مضبوط پاس ورڈ چنیں۔',
    tooManyRequests: 'بہت زیادہ کوششیں ہو گئیں۔ براہِ کرم کچھ دیر انتظار کریں۔',
    network: 'انٹرنیٹ کنکشن نہیں ہے۔ اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
    generic: 'کچھ غلط ہو گیا۔ براہِ کرم دوبارہ کوشش کریں۔',
  },
  account: {
    greeting: 'خوش آمدید، {{name}}',
    roleLabel: 'اکاؤنٹ کی قسم',
    role: {
      customer: 'گاہک',
      store: 'دکان',
      rider: 'رائیڈر',
    },
    signOut: 'سائن آؤٹ',
  },
  profileProblem: {
    title: 'ہم آپ کا اکاؤنٹ لوڈ نہیں کر سکے',
    body: 'اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔ اگر یہ بار بار ہو تو سائن آؤٹ کر کے دوبارہ سائن اِن کریں۔',
  },
};
