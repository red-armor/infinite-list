const { withNx } = require('@nx/rollup/with-nx');

module.exports = withNx(
  {
    // main: './src/index.ts',
    additionalEntryPoints: [],
    outputPath: '../../dist/ui/scroller',
    tsConfig: './tsconfig.lib.json',
    compiler: 'babel',
    format: ['esm'],
    // babelUpwardRootMode: true,
    // buildLibsFromSource: false,
    // external: [
    //   '@infinite-list/intersection-observer/react-native',
    //   '@infinite-list/intersection-observer',
    // ],
    // generateExportsField: true,
    assets: [{ input: '.', output: '.', glob: '*.md' }],
  },
  {
    // Provide additional rollup configuration here. See: https://rollupjs.org/configuration-options
    // e.g.
    // output: { sourcemap: true },
    input: ['./src/react-native', './src/web'],
    output: {
      entryFileNames: (chunk) => {
        if (chunk.facadeModuleId.endsWith('src/react-native/index.ts')) {
          return 'react-native.esm.js';
        }
        if (chunk.facadeModuleId.endsWith('src/web/index.ts')) {
          return 'web.esm.js';
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
  }
);
