const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  // Reports Prettier formatting problems as lint errors, so there is one source of truth.
  eslintPluginPrettierRecommended,
  {
    // `supabase/` holds SQL and its Node test scripts, which follow their own conventions.
    ignores: ['dist/*', '.expo/*', 'supabase/**'],
  },
  {
    rules: {
      // `any` switches off type checking; use `unknown` and narrow instead.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Use `logger` from '@/lib/logger' instead of console.
      'no-console': 'error',
      // Import order: third-party, then '@/' aliases, then relative files.
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
]);
