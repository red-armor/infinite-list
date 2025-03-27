import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/react/index.ts', 'src/react-native/index.ts'],
  format: 'esm',

  splitting: true,
});
