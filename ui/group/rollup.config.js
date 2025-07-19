const { withNx } = require('@nx/rollup/with-nx');

module.exports = {
  input: ['ui/group/src/react-native/index.ts', 'ui/group/src/react/index.ts'],
  output: {
    dir: 'dist/ui/group',
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
