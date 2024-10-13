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

const dataModelPkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'data-model', 'package.json'), 'utf8'))
const dataModelModules = Object.keys({
  ...dataModelPkg.dependencies
})

const extraModules = dataModelModules.reduce(
    (acc, name) => {
      acc[name] = path.join(__dirname, '..', '..', '..', 'data-model', 'node_modules', name)
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
  '@infinite-list/react-native': path.join(__dirname, '..', '..', 'src'),
  '@infinite-list/data-model': path.join(__dirname, '..', '..', '..', 'data-model', 'src')
}

config.watchFolders = [
  path.join(__dirname, '..', '..', 'src'),
  path.join(__dirname, '..', '..', '..', 'data-model', 'node_modules'),
  path.join(__dirname, '..', '..', '..', 'data-model', 'src'),
  path.join(__dirname, '..', '..', '..', '..', 'node_modules'),
]

// config.transformer = {
//   getTransformOptions: async () => ({
//       transform: {
//           experimentalImportSupport: false,
//           inlineRequires: false,
//       },
//   }),
// }

console.log('confing ==== ', config.resolver.extraNodeModules)

module.exports = config;
