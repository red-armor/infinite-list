// const copy = require('rollup-plugin-copy');
import copy from 'rollup-plugin-copy';

export default [
  // ...
  {
    // ...
    plugins: [
      // ...
      copy({
        targets: [{ src: './src/react-native/index.ts', dest: 'dist' }],
      }),
    ],
  },
];
