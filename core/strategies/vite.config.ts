import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/core/strategies',

  plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'strategies',
      fileName: 'index',
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      external: [
        '@infinite-list/types',
        '@infinite-list/base-dimensions',
        '@infinite-list/item-meta',
        '@infinite-list/utils',
        '@infinite-list/viewable',
        '@infinite-list/container',
        '@x-oasis/batchinator',
        '@x-oasis/default-boolean-value',
        '@x-oasis/default-value',
        '@x-oasis/is-clamped',
        '@x-oasis/recycler',
      ],
    },
  },
});
