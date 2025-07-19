import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/ui/scroller',

  plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],

  build: {
    lib: {
      entry: {
        'react-native': resolve(__dirname, 'src/react-native/index.ts'),
        web: resolve(__dirname, 'src/web/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.esm.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-native',
        '@x-oasis/is-ref',
        '@x-oasis/noop',
        '@x-oasis/select-value',
        '@x-oasis/shallow-equal',
        '@x-oasis/throttle',
        '@infinite-list/item-meta',
        '@infinite-list/scheduler',
        '@infinite-list/disposable',
        '@infinite-list/types',
        '@infinite-list/items-dimensions',
        '@infinite-list/viewable',
        '@infinite-list/intersection-observer',
      ],
      output: {
        entryFileNames: '[name].esm.js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name].[ext]',
        globals: {
          react: 'React',
          'react-native': 'ReactNative',
        },
      },
    },
    sourcemap: true,
    minify: false,
    emptyOutDir: true,
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
