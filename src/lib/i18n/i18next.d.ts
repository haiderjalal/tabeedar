import type { DEFAULT_NAMESPACE } from './config';
import type { resources } from './locales';

/**
 * Teaches TypeScript the exact set of translation keys, so `t('app.nmae')` is a compile
 * error instead of a blank string at runtime. English is the reference; Urdu must match
 * its shape (enforced in `locales/ur`).
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof DEFAULT_NAMESPACE;
    resources: (typeof resources)['en'];
  }
}
