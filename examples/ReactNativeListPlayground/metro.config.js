// const { getDefaultConfig } = require('expo/metro-config');
// const path = require('path')
// const fs = require('fs')

// const config = getDefaultConfig(__dirname);

// const root = path.resolve(__dirname)
// const pak = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

// const modules = Object.keys({
//   ...pak.peerDependencies,
//   ...pak.dependencies,
// })

// console.log('----', path.join(__dirname, '..', '..', 'src'))

// config.resolver.extraNodeModules =  modules.reduce(
//   (acc, name) => {
//     acc[name] = path.join(__dirname, 'node_modules', name)
//     return acc
//   },
//   {
//     '@infinite-list/react-native': path.join(__dirname, '..', '..', 'src', 'index.ts')
//   }
// )

// module.exports = config;

const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// const root = path.resolve(__dirname)
// const pak = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

// const modules = Object.keys({
//   ...pak.peerDependencies,
//   ...pak.dependencies,
// })

// console.log('----', path.join(__dirname, '..', '..', 'src'))

// config.resolver.extraNodeModules =  modules.reduce(
//   (acc, name) => {
//     acc[name] = path.join(__dirname, 'node_modules', name)
//     return acc
//   },
//   {
//     '@infinite-list/react-native': path.join(__dirname, '..', '..', 'src', 'index.ts')
//   }
// )

const root = path.resolve(__dirname, '..', '..');

const dataModelPkg = JSON.parse(
  fs.readFileSync(
    path.join(root, 'packages', 'data-model', 'package.json'),
    'utf8'
  )
);
const dataModelModules = Object.keys({
  ...dataModelPkg.dependencies,
});
const reactNativePkg = JSON.parse(
  fs.readFileSync(
    path.join(root, 'packages', 'react-native', 'package.json'),
    'utf8'
  )
);
const reactNativeModules = Object.keys({
  ...reactNativePkg.dependencies,
});
const masonryPkg = JSON.parse(
  fs.readFileSync(path.join(root, 'ui', 'masonry', 'package.json'), 'utf8')
);
const masonryModules = Object.keys({
  ...masonryPkg.dependencies,
});
const scrollerPkg = JSON.parse(
  fs.readFileSync(path.join(root, 'ui', 'scroller', 'package.json'), 'utf8')
);
const scrollerModules = Object.keys({
  ...scrollerPkg.dependencies,
});
const listPkg = JSON.parse(
  fs.readFileSync(path.join(root, 'ui', 'list', 'package.json'), 'utf8')
);
const listModules = Object.keys({
  ...listPkg.dependencies,
});
const groupPkg = JSON.parse(
  fs.readFileSync(path.join(root, 'ui', 'group', 'package.json'), 'utf8')
);
const groupModules = Object.keys({
  ...groupPkg.dependencies,
});

const extraModules = []
  .concat(
    reactNativeModules,
    dataModelModules,
    masonryModules,
    scrollerModules,
    listModules,
    groupModules
  )
  .reduce((acc, name) => {
    acc[name] = path.join(root, 'packages', 'data-model', 'node_modules', name);
    return acc;
  }, {});

config.resolver.extraNodeModules = {
  ...extraModules,
  react: path.join(__dirname, 'node_modules', 'react'),
  'react-dom': path.join(__dirname, 'node_modules', 'react-dom'),
  'react-native': path.join(__dirname, 'node_modules', 'react-native'),
  '@infinite-list/react-native': path.join(
    root,
    'packages',
    'react-native',
    'src'
  ),
  '@infinite-list/data-model': path.join(root, 'packages', 'data-model', 'src'),

  /**
   * core
   */
  '@infinite-list/base-dimensions': path.join(
    root,
    'core',
    'base-dimensions',
    'src'
  ),
  '@infinite-list/container': path.join(root, 'core', 'container', 'src'),
  '@infinite-list/dimensions-model': path.join(
    root,
    'core',
    'dimensions-model',
    'src'
  ),
  '@infinite-list/item-meta': path.join(root, 'core', 'item-meta', 'src'),
  '@infinite-list/state': path.join(root, 'core', 'state', 'src'),
  '@infinite-list/strategies': path.join(root, 'core', 'strategies', 'src'),
  '@infinite-list/types': path.join(root, 'core', 'types', 'src'),
  '@infinite-list/utils': path.join(root, 'core', 'utils', 'src'),
  '@infinite-list/viewable': path.join(root, 'core', 'viewable', 'src'),

  /**
   * model
   */
  '@infinite-list/dimension': path.join(root, 'model', 'dimension', 'src'),
  '@infinite-list/group-dimensions': path.join(
    root,
    'model',
    'group-dimensions',
    'src'
  ),
  '@infinite-list/items-dimensions': path.join(
    root,
    'model',
    'items-dimensions',
    'src'
  ),
  '@infinite-list/list-dimensions': path.join(
    root,
    'model',
    'list-dimensions',
    'src'
  ),
  '@infinite-list/masonry-dimensions': path.join(
    root,
    'model',
    'masonry-dimensions',
    'src'
  ),

  /**
   * ui
   */
  '@infinite-list/list': path.join(root, 'ui', 'list', 'src'),
  '@infinite-list/group': path.join(root, 'ui', 'group', 'src'),
  '@infinite-list/masonry': path.join(root, 'ui', 'masonry', 'src'),
  '@infinite-list/scroller': path.join(root, 'ui', 'scroller', 'src'),
};

config.watchFolders = [
  path.join(root, 'packages', 'react-native', 'src'),
  path.join(root, 'packages', 'react-native', 'node_modules'),
  path.join(root, 'packages', 'data-model', 'src'),
  path.join(root, 'packages', 'data-model', 'node_modules'),

  /**
   * core
   */
  path.join(root, 'core', 'base-dimensions', 'src'),
  path.join(root, 'core', 'base-dimensions', 'node_modules'),
  path.join(root, 'core', 'container', 'src'),
  path.join(root, 'core', 'container', 'node_modules'),
  path.join(root, 'core', 'dimensions-model', 'src'),
  path.join(root, 'core', 'dimensions-model', 'node_modules'),
  path.join(root, 'core', 'item-meta', 'src'),
  path.join(root, 'core', 'item-meta', 'node_modules'),
  path.join(root, 'core', 'state', 'src'),
  path.join(root, 'core', 'state', 'node_modules'),
  path.join(root, 'core', 'strategies', 'src'),
  path.join(root, 'core', 'strategies', 'node_modules'),
  path.join(root, 'core', 'types', 'src'),
  path.join(root, 'core', 'types', 'node_modules'),
  path.join(root, 'core', 'utils', 'src'),
  path.join(root, 'core', 'utils', 'node_modules'),
  path.join(root, 'core', 'viewable', 'src'),
  path.join(root, 'core', 'viewable', 'node_modules'),

  /**
   * model
   */
  path.join(root, 'model', 'dimension', 'src'),
  path.join(root, 'model', 'dimension', 'node_modules'),
  path.join(root, 'model', 'group-dimensions', 'src'),
  path.join(root, 'model', 'group-dimensions', 'node_modules'),
  path.join(root, 'model', 'items-dimensions', 'src'),
  path.join(root, 'model', 'items-dimensions', 'node_modules'),
  path.join(root, 'model', 'list-dimensions', 'src'),
  path.join(root, 'model', 'list-dimensions', 'node_modules'),
  path.join(root, 'model', 'masonry-dimensions', 'src'),
  path.join(root, 'model', 'masonry-dimensions', 'node_modules'),

  /**
   * ui
   */
  path.join(root, 'ui', 'group', 'src'),
  path.join(root, 'ui', 'group', 'node_modules'),
  path.join(root, 'ui', 'list', 'src'),
  path.join(root, 'ui', 'list', 'node_modules'),
  path.join(root, 'ui', 'masonry', 'src'),
  path.join(root, 'ui', 'masonry', 'node_modules'),
  path.join(root, 'ui', 'scroller', 'src'),
  path.join(root, 'ui', 'scroller', 'node_modules'),

  path.join(root, 'node_modules'),
];
// config.watchFolders = [
//   path.join(__dirname, '..', '..', 'src'),
//   path.join(__dirname, '..', '..', '..', 'data-model', 'node_modules'),
//   path.join(__dirname, '..', '..', '..', 'data-model', 'src'),
//   path.join(__dirname, '..', '..', '..', '..', 'node_modules'),
// ]

// config.transformer = {
//   getTransformOptions: async () => ({
//       transform: {
//           experimentalImportSupport: false,
//           inlineRequires: false,
//       },
//   }),
// }

const { resolver } = config;
config.resolver = {
  ...resolver,
  resolveRequest: (context, moduleName, platform) => {
    console.log('resolveRequest', moduleName);
    // if (moduleName.startsWith('@infinite-list/react-native')) {
    //   return {
    //     filePath: path.join(root, 'packages', 'react-native', 'src'),
    //     // filePath: `${__dirname}/node_modules/graphql-request/build/esm/index.js`,
    //     type: 'sourceFile',
    //   }
    // }

    if (moduleName === 'react') {
      return {
        filePath: path.join(__dirname, 'node_modules', 'react', 'index.js'),
        // filePath: `${__dirname}/node_modules/graphql-request/build/esm/index.js`,
        type: 'sourceFile',
      };
    }

    if (moduleName === 'react-native') {
      return {
        filePath: path.join(
          __dirname,
          'node_modules',
          'react-native',
          'index.js'
        ),
        // filePath: `${__dirname}/node_modules/graphql-request/build/esm/index.js`,
        type: 'sourceFile',
      };
    }

    return context.resolveRequest(context, moduleName, platform);
  },
};

console.log('confing ==== ', config.resolver.extraNodeModules);

module.exports = config;
