const path = require('path')

module.exports = function (api) {
  console.log('pai ', api.include)

  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // include: [
    //   '.',
    //   path.join(__dirname, '..', '..', 'src'),

    // ],
    // plugins: [
    //   [
    //     'module-resolver',
    //     {
    //       root: path.resolve(__dirname),
    //       extensions: [
    //         '.js',
    //         '.jsx',
    //         '.ts',
    //         '.tsx',
    //         '.android.js',
    //         '.android.tsx',
    //         '.ios.js',
    //         '.ios.tsx',
    //       ],
    //       alias: {
    //         "@infinite-list/react-native": '../../src'
    //         // "@themes": '../packages/spectrum/src/themes'
    //       },
    //     },
    //   ]
    // ]
  };
};
