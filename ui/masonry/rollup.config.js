module.exports = {
  input: [
    'ui/masonry/src/react-native/index.ts',
    'ui/masonry/src/react/index.ts',
  ],
  output: {
    dir: 'dist/ui/masonry',
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
