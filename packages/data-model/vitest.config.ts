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
    include: [
      // 'src/__test__/**/ListDimensions.space.test.ts',
      // 'src/__test__/**/ListDimensions.recycle.test.ts',
      'src/__test__/**/ListGroupDimensions.test.ts',
      'src/__test__/**/reducer.test.ts',
      'src/__test__/**/SortedItems.test.ts',
      'src/__test__/**/ViewabilityConfigTuples.test.ts',
      'src/__test__/**/viewabilityUtils.test.ts',
    ],
    // include: ['src/__test__/**/ListDimensions.test.ts'],
    // include: ['src/__test__/**/ListGroupDimensions.test.ts'],
    // browser: true,
  },

  // @ts-ignore
  plugins: [tsPath()],
});
