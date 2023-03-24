import { defineConfig } from 'vitest/config';
import tsPath from 'vite-tsconfig-paths';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  test: {
    globals: true,
    include: ['src/__test__/**/*.test.ts'],
  },

  // @ts-ignore
  plugins: [tsPath()],
});
