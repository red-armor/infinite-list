module.exports = {
  input: [
    'ui/scroller/src/react-native/index.ts',
    'ui/scroller/src/web/index.ts',
  ],
  output: {
    dir: 'dist/ui/scroller',
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
