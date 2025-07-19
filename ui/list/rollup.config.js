module.exports = {
  input: ['ui/list/src/react-native/index.ts', 'ui/list/src/react/index.ts'],
  output: {
    dir: 'dist/ui/list',
    entryFileNames: (chunk) => {
      if (chunk.facadeModuleId.endsWith('src/react-native/index.ts')) {
        return 'react-native.esm.js';
      }
      if (chunk.facadeModuleId.endsWith('src/react/index.ts')) {
        return 'react.esm.js';
      }
    },
  },
};
