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
      "client/"
    ]
  },
  { extends: ["js/recommended"], files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js } },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    plugins: {
      "perfectionist": perfectionist,
    },
    rules: {
      "indent": ["warn", 2],
      'perfectionist/sort-imports': [
        'error',
        {
          customGroups: [],
          environment: 'node',
          fallbackSort: { type: 'unsorted' },
          groups: [
            'type-import',
            ['value-builtin', 'value-external'],
            'type-internal',
            'value-internal',
            ['type-parent', 'type-sibling', 'type-index'],
            ['value-parent', 'value-sibling', 'value-index'],
            'ts-equals-import',
            'unknown',
          ],
          ignoreCase: true,
          internalPattern: ['^~/.+', '^@/.+'],
          maxLineLength: undefined,
          newlinesBetween: 'always',
          order: 'asc',
          partitionByComment: false,
          partitionByNewLine: false,
          specialCharacters: 'keep',
          type: 'alphabetical',
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
    }
  }
]);