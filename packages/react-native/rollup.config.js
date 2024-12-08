const { withNx } = require('@nx/rollup/with-nx');

module.exports = withNx(
  {
    main: './src/index.ts',
    outputPath: '../../dist/packages/react-native',
    tsConfig: './tsconfig.lib.json',
    compiler: 'babel',
    format: ['esm'],
    assets: [{ input: '.', output: '.', glob: '*.md' }],
  },
  {
    // Provide additional rollup configuration here. See: https://rollupjs.org/configuration-options
    // e.g.
    // output: { sourcemap: true },
    input: ['./src/index.ts', './src/next.ts'],
  }
);

// const nrwlConfig = require('@nrwl/react/plugins/bundle-rollup');

// module.exports = (nxConfig) => {
//   nrwlConfig(nxConfig);

//   return {
//     ...nxConfig,
//     input: [nxConfig.input, 'packages/component-library/src/hooks'],
//     output: {
//       ...nxConfig.output,
//       format: 'esm',
//       entryFileNames: '[name].esm.js',
//       chunkFileNames: '[name].esm.js',
//       inlineDynamicImports: false,
//     },
//   };
// };
