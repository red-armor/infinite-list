import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/react-native/index.ts', 'src/web/index.ts'],
  format: 'esm',

  splitting: true,
});
