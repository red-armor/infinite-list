const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { resolveModuleMapping, resolveNodeModulesMapping } = require('./test')

const moduleMapping = resolveModuleMapping()
const nodeModulesMapping = resolveNodeModulesMapping()

console.log(' nodeModulesMapping ', nodeModulesMapping)

const toWatch = [].concat(Object.values(nodeModulesMapping), Object.values(moduleMapping))

const config = getDefaultConfig(__dirname);

const root = path.resolve(__dirname, '..', '..');

/**
 * 依据 package.json 的 exports、module、main 字段，生成模块路径映射；
 * {
  '@infinite-list/base-dimensions': '/xxxxx/infinite-list/core/base-dimensions/src',
  '@infinite-list/container': '/xxxxx/infinite-list/core/container/src',
  '@infinite-list/dimensions-model': '/xxxxx/infinite-list/core/dimensions-model/src',
  '@infinite-list/disposable': '/xxxxx/infinite-list/core/disposable/src',
  .....
  react: '/xxxxx/infinite-list/examples/ReactNativeListPlayground/node_modules/react',
  'react-dom': '/xxxxx/infinite-list/examples/ReactNativeListPlayground/node_modules/react-dom',
  'react-native': '/xxxxx/infinite-list/examples/ReactNativeListPlayground/node_modules/react-native'
}
 */
config.resolver.extraNodeModules = {
  ...moduleMapping,
  react: path.join(__dirname, 'node_modules', 'react'),
  'react-dom': path.join(__dirname, 'node_modules', 'react-dom'),
  'react-native': path.join(__dirname, 'node_modules', 'react-native'),
};

console.log('resolve ----- ', config.resolver.extraNodeModules)

console.log('ath ',toWatch)

/**
 * should watch src and node_modules
 * 
 * '/xxx/infinite-list/core/base-dimensions/src',
 * '/xxx/infinite-list/core/base-dimensions/node_modules',
 * '/xxx/infinite-list/core/container/src',
 * '/xxx/infinite-list/core/container/node_modules',
 * 
 */
config.watchFolders = [].concat(toWatch, path.join(root, 'node_modules'))

const { resolver } = config;
config.resolver = {
  ...resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'react') {
      return {
        filePath: path.join(__dirname, 'node_modules', 'react', 'index.js'),
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

module.exports = config;
