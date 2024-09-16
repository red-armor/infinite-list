import { defineConfig } from 'vitest/config';
import tsPath from 'vite-tsconfig-paths';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  define: {
    requestIdleCallback: null,
    // requestIdleCallback:  JSON.stringify('function requestIdleCallback(cb) { setTimeout(cb, 0 )}')
  },

  test: {
    globals: true,
    // include: ['src/__test__/**/*.test.ts'],
    // include: ['src/__test__/**/reducer.test.ts'],
    // setupFiles: ['./src/__test__/setup.js'],
    // fakeTimers: {
    //   requestIdleCallback: true,
    // }
    // include: ['src/__test__/**/reducer.test.ts'],
    include: ['src/__test__/**/ListDimensions.test.ts'],
    // browser: true,
  },

  // @ts-ignore
  plugins: [tsPath()],
});
