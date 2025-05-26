const { withNx } = require('@nx/rollup/with-nx');

module.exports = withNx(
  {
    additionalEntryPoints: [],
    outputPath: '../../dist/core/intersection-observer',
    generateExportsField: true,
    tsConfig: './tsconfig.lib.json',
    compiler: 'babel',
    format: ['esm'],
    rollupConfig: ['./rollup.raw.config.mjs'],
    assets: [{ input: '.', output: '.', glob: '*.md' }],
  },
  {
    input: ['./src/react-native', './src/react'],
    output: {
      entryFileNames: (chunk) => {
        if (chunk.facadeModuleId.endsWith('src/react-native/index.ts')) {
          return 'react-native.esm.js';
        }
        if (chunk.facadeModuleId.endsWith('src/react/index.ts')) {
          return 'react.esm.js';
        }
      },
    },
  }
);
