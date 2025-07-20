import js from "@eslint/js";
import perfectionist from 'eslint-plugin-perfectionist';
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      "**/*.js",
    ]
  },
  {
    extends: ["js/recommended"],
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      js
    }
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      }
    }
  },
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  {
    plugins: {
      perfectionist,
      react: pluginReact
    },
    rules: {
      "indent": ["warn", 2],
      'perfectionist/sort-imports': [
        'error',
        {
          customGroups: [
            {
              elementNamePattern: ['^@(components|hooks|api|selectors)', '^src/*'],
              groupName: "my-code"
            },
            {
              elementNamePattern: ['^@types'],
              groupName: "my-types"
            },
            {
              elementNamePattern: ['@assets'],
              groupName: "my-assets"
            }
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
    }
  }
]);