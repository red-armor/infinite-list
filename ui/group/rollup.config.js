const { withNx } = require('@nx/rollup/with-nx');

module.exports = withNx(
  {
    // main: './src/index.ts',
    // may cause
    additionalEntryPoints: [],
    outputPath: '../../dist/ui/group',
    tsConfig: './tsconfig.lib.json',
    compiler: 'babel',
    format: ['esm'],
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

        // if (chunk.facadeModuleId.endsWith('src/react-native')) {
        //   return 'react-native.esm.js'
        // }

        // if (chunk.facadeModuleId.endsWith('src/web')) {
        //   return 'web.esm.js'
        // }
        // if (chunk.facadeModuleId.includes('/module')) {
        //     const dir = path.dirname(chunk.facadeModuleId);
        //     return 'module/' + path.basename(dir) + '.js';
        // }
      },
    },

    // Provide additional rollup configuration here. See: https://rollupjs.org/configuration-options
    // e.g.
    // output: { sourcemap: true },
  }
);
