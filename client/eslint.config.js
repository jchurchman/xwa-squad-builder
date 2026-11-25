import js from '@eslint/js';
import perfectionist from 'eslint-plugin-perfectionist';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    ignores: ['node_modules/', 'dist/', 'build/', '**/*.js'],
  },
  {
    extends: ['js/recommended'],
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      js,
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  {
    plugins: {
      perfectionist,
      react: pluginReact,
    },
    rules: {
      complexity: ['error', 10],
      indent: ['warn', 2],
      'max-depth': ['error', 3],
      'no-nested-ternary': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              message:
                'Import through the @/ alias (e.g. @/hooks/useSquad), not a parent path or src/.',
              regex: '^(\\.\\./|src/)',
            },
          ],
        },
      ],
      'perfectionist/sort-imports': [
        'error',
        {
          customGroups: [
            {
              elementNamePattern: ['^@/assets/'],
              groupName: 'my-assets',
            },
            {
              elementNamePattern: ['^@/types/'],
              groupName: 'my-types',
            },
            {
              elementNamePattern: ['^@/'],
              groupName: 'my-code',
            },
          ],
          environment: 'node',
          fallbackSort: { order: 'asc', type: 'line-length' },
          groups: [
            'my-assets',
            ['value-builtin', 'value-external'],
            'value-internal',
            'my-code',
            ['value-parent', 'value-sibling', 'value-index'],
            'value-side-effect-style',
            'side-effect-style',
            'value-style',
            'type-import',
            'type-internal',
            'my-types',
            ['type-parent', 'type-sibling', 'type-index'],
            'ts-equals-import',
            'unknown',
          ],
          ignoreCase: true,
          internalPattern: ['^~/.+', '^@/.+'],
          order: 'asc',
        },
      ],
      'perfectionist/sort-interfaces': [
        'error',
        {
          customGroups: [],
          fallbackSort: { type: 'unsorted' },
          groupKind: 'mixed',
          groups: [],
          ignoreCase: true,
          ignorePattern: [],
          newlinesBetween: 'ignore',
          order: 'asc',
          partitionByComment: false,
          partitionByNewLine: false,
          sortBy: 'name',
          specialCharacters: 'keep',
          type: 'alphabetical',
          useConfigurationIf: {},
        },
      ],
      'perfectionist/sort-jsx-props': [
        'error',
        {
          customGroups: {},
          fallbackSort: { type: 'unsorted' },
          groups: [],
          ignoreCase: true,
          ignorePattern: [],
          newlinesBetween: 'ignore',
          order: 'asc',
          partitionByNewLine: false,
          specialCharacters: 'keep',
          type: 'alphabetical',
          useConfigurationIf: {},
        },
      ],
      'perfectionist/sort-named-imports': [
        'error',
        {
          customGroups: [],
          fallbackSort: { type: 'unsorted' },
          groupKind: 'mixed',
          groups: [],
          ignoreAlias: false,
          ignoreCase: true,
          newlinesBetween: 'ignore',
          order: 'asc',
          partitionByComment: true,
          partitionByNewLine: false,
          specialCharacters: 'keep',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-object-types': [
        'error',
        {
          customGroups: [],
          fallbackSort: { type: 'unsorted' },
          groups: [],
          ignoreCase: true,
          ignorePattern: [],
          newlinesBetween: 'ignore',
          order: 'asc',
          partitionByComment: false,
          partitionByNewLine: false,
          sortBy: 'name',
          specialCharacters: 'keep',
          type: 'alphabetical',
          useConfigurationIf: {},
        },
      ],
      'perfectionist/sort-objects': [
        'error',
        {
          customGroups: [],
          destructuredObjects: true,
          fallbackSort: { type: 'unsorted' },
          groups: [],
          ignoreCase: true,
          ignorePattern: [],
          newlinesBetween: 'ignore',
          objectDeclarations: true,
          order: 'asc',
          partitionByComment: false,
          partitionByNewLine: false,
          specialCharacters: 'keep',
          styledComponents: true,
          type: 'alphabetical',
          useConfigurationIf: {},
        },
      ],
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_$',
          varsIgnorePattern: '^_$',
        },
      ],
      'no-unused-vars': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
    settings: {
      react: {
        defaultVersion: '19.1.0',
        version: 'detect',
      },
    },
  },
]);
