// @ts-check
import { fixupPluginRules } from '@eslint/compat';
import { defineConfig } from 'eslint-config-hyoban';
import reactNative from 'eslint-plugin-react-native';

export default defineConfig(
  {
    formatting: false,
    lessOpinionated: true,
    ignores: [],

    preferESM: false,
    tailwindCSS: false,
  },
  {
    settings: {},

    rules: {
      '@eslint-react/no-clone-element': 0,
      '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 0,
      '@eslint-react/dom/no-flush-sync': 1,
      // NOTE: Disable this temporarily
      'react-compiler/react-compiler': 0,
      'no-restricted-syntax': 0,
    },
  },

  {
    plugins: {
      'react-native': fixupPluginRules(reactNative),
    },
    files: ['apps/mobile/**/*'],
    rules: {
      'react-native/no-inline-styles': 'warn',
    },
  }
);
