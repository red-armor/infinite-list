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


const path = require('path')
const fs = require('fs')
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

const root = path.resolve(__dirname, '..', '..')

const dataModelPkg = JSON.parse(fs.readFileSync(path.join(root, 'packages', 'data-model', 'package.json'), 'utf8'))
const dataModelModules = Object.keys({
  ...dataModelPkg.dependencies
})
const reactNativePkg = JSON.parse(fs.readFileSync(path.join(root, 'packages', 'react-native', 'package.json'), 'utf8'))
const reactNativeModules = Object.keys({
  ...reactNativePkg.dependencies
})

const extraModules = [].concat(reactNativeModules, dataModelModules).reduce(
    (acc, name) => {
      acc[name] = path.join(root, 'packages', 'data-model', 'node_modules', name)
      return acc
    },
    {

    }
  )

config.resolver.extraNodeModules = {
  ...extraModules,
  'react': path.join(__dirname, 'node_modules', 'react'),
  'react-dom': path.join(__dirname, 'node_modules', 'react-dom'),
  'react-native': path.join(__dirname, 'node_modules', 'react-native'),
  '@infinite-list/react-native': path.join(root, 'packages', 'react-native', 'src'),
  '@infinite-list/data-model': path.join(root, 'packages', 'data-model', 'src')
}

config.watchFolders = [
  path.join(root, 'packages','react-native',  'src'),
  path.join(root, 'packages', 'react-native', 'node_modules'),
  path.join(root, 'packages', 'data-model', 'src'),
  path.join(root, 'packages', 'data-model', 'node_modules'),
  path.join(root, 'node_modules'),
]
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
    console.log('resolveRequest', moduleName)
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
        }
      }
  
      if (moduleName === 'react-native') {
        return {
          filePath: path.join(__dirname, 'node_modules', 'react-native', 'index.js'),
          // filePath: `${__dirname}/node_modules/graphql-request/build/esm/index.js`,
          type: 'sourceFile',
        }
      }
  
      return context.resolveRequest(context, moduleName, platform)
    }
};

console.log('confing ==== ', config.resolver.extraNodeModules)

module.exports = config;
