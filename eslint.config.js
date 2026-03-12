import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

const srcFiles = ['src/**/*.{ts,tsx}'];

export default [
  {
    ignores: ['coverage/**', 'dist/**', 'supabase/functions/**'],
  },
  js.configs.recommended,
  ...tseslint.configs['flat/recommended'],
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  jsxA11y.flatConfigs.recommended,
  importPlugin.flatConfigs.recommended,
  reactRefresh.configs.vite,
  eslintPluginPrettierRecommended,
  {
    files: srcFiles,
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'off',
      'react/prop-types': 'off',
      'import/no-unresolved': 'off',
      'import/prefer-default-export': 'off',
      'react/require-default-props': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/function-component-definition': [
        'error',
        {
          namedComponents: ['function-declaration', 'arrow-function'],
          unnamedComponents: 'arrow-function',
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      'prettier/prettier': 'warn',
      'react/jsx-filename-extension': ['warn', { extensions: ['.jsx', '.tsx'] }],
      'jsx-a11y/label-has-associated-control': [
        'error',
        {
          required: {
            some: ['nesting', 'id'],
          },
        },
      ],
      'no-nested-ternary': 'off',
      'consistent-return': 'off',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'no-bitwise': 'off',
      'no-plusplus': 'off',
      'no-param-reassign': 'warn',
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'react/button-has-type': 'off',
      'prefer-template': 'warn',
      'react/no-array-index-key': 'off',
      'no-promise-executor-return': 'off',
      'prefer-destructuring': 'warn',
      'no-alert': 'warn',
      'no-else-return': 'warn',
      '@typescript-eslint/no-use-before-define': 'off',
      'no-use-before-define': 'off',
      'react/no-unescaped-entities': 'off',
      'no-restricted-syntax': 'off',
      radix: 'warn',
      'default-case': 'warn',
      'no-return-assign': 'off',
      'jsx-a11y/role-has-required-aria-props': 'off',
      'no-restricted-globals': 'warn',
      'jsx-a11y/no-noninteractive-tabindex': 'warn',
      'lines-between-class-members': 'off',
      'no-void': 'off',
      'dot-notation': 'warn',
      'import/no-duplicates': 'warn',
      'react/jsx-boolean-value': 'off',
      'no-constant-condition': 'off',
      'no-await-in-loop': 'error',
    },
  },
];
