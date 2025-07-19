import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/ui/scroller',

  plugins: [
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: resolve(__dirname, 'tsconfig.lib.json'),
      insertTypesEntry: true,
      outDir: '../../dist/ui/scroller',
      copyDtsFiles: true,
      afterBuild: (dtsFiles) => {
        // 重命名生成的文件
        const distDir = resolve(__dirname, '../../dist/ui/scroller');

        // 重命名 web.d.ts 为 web.esm.d.ts
        const webDtsPath = resolve(distDir, 'web.d.ts');
        const webEsmDtsPath = resolve(distDir, 'web.esm.d.ts');
        if (existsSync(webDtsPath)) {
          const content = readFileSync(webDtsPath, 'utf-8');
          writeFileSync(webEsmDtsPath, content);
          unlinkSync(webDtsPath);
        }

        // 重命名 react-native.d.ts 为 react-native.esm.d.ts
        const rnDtsPath = resolve(distDir, 'react-native.d.ts');
        const rnEsmDtsPath = resolve(distDir, 'react-native.esm.d.ts');
        if (existsSync(rnDtsPath)) {
          const content = readFileSync(rnDtsPath, 'utf-8');
          writeFileSync(rnEsmDtsPath, content);
          unlinkSync(rnDtsPath);
        }
      },
    }),
  ],

  build: {
    outDir: '../../dist/ui/scroller',
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
