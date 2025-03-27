export default {
  input: ['./src/react-native/index.ts', './src/web/index.ts'],
  output: {
    entryFileNames: (chunk) => {
      if (chunk.facadeModuleId.endsWith('src/react-native/index.ts')) {
        return 'react-native.esm.js';
      }
      if (chunk.facadeModuleId.endsWith('src/web/index.ts')) {
        return 'web.esm.js';
      }
    },
  },
};
