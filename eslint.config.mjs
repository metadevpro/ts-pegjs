import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  // Lint the project's own source code (`npm run lint`)
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      'linebreak-style': 'off',
      quotes: 'off',
      semi: ['error', 'always'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ]
    }
  },
  // Lint parsers generated into `output/` by the test suite. This is
  // machine-generated code, so type-safety rules are relaxed.
  {
    files: ['output/**/*.ts'],
    rules: {
      'prefer-const': 'off',
      'prefer-spread': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off'
    }
  }
];
