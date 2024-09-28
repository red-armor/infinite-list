const baseConfig = require('../../eslint.config.js');

module.exports = [
  ...baseConfig,
  {
    // ====== temp ignore, which will case package.json check error ==
    // files: ['**/*.json'],
    // rules: {
    //   '@nx/dependency-checks': [
    //     'error',
    //     {
    //       ignoredFiles: [
    //         '{projectRoot}/eslint.config.{js,cjs,mjs}',
    //         '{projectRoot}/vite.config.{js,ts,mjs,mts}',
    //       ],
    //     },
    //   ],
    // },
    // languageOptions: {
    //   parser: require('jsonc-eslint-parser'),
    // },
  },
];
