const { resolveModules } = require('./index.cjs')
const path = require('path')
const fs = require('fs')

const root = path.resolve(__dirname, '..', '..');
const resolver = (options, packageName, modulePath) => {
  const { module, main } = options
  const mapping = {}

  // if (exports) {
  //   for (const exportedKey in exports) {
  //     const key = cleanPackagePath(`${packageName}/${exportedKey}`)
  //     const targetPath = path.join(modulePath, 'src')

  //     if (fs.existsSync(targetPath)) {
  //       mapping[key] = targetPath
  //     }
  //   }
  // }

  if (module) {
    const resolvedModulePath = path.join(modulePath, 'src')
    if (fs.existsSync(resolvedModulePath)) {
      mapping[packageName] = resolvedModulePath
    }
  } else if (main) {
    const resolvedModulePath = path.join(modulePath, 'src')
    if (fs.existsSync(resolvedModulePath)) {
      mapping[packageName] = resolvedModulePath
    }
  }

  return mapping
}

const resolveModuleMapping = () => {
  const mapping = {};
  ['core', 'model', 'ui'].map(dir => 
   resolveModules({
      rootPath: path.join(root),
      targetDir: dir,
      resolveModulePath: resolver
    })
  ).forEach(m => {
    Object.assign(mapping, m)
  })
  return mapping
}

const resolveNodeModulesMapping = () => {
  const mapping = {};
  ['core', 'model', 'ui'].map(dir =>  {
    return resolveModules({
      rootPath: path.join(root),
      targetDir: dir,
      resolveModulePath: (options, packageName, modulePath) => {
        const targetPath = path.join(modulePath, 'node_modules')
        if (fs.existsSync(targetPath)) {
          mapping[packageName] = targetPath
        }
        return mapping
      }
    })
  }).forEach(m => {
    Object.assign(mapping, m)
  })
  return mapping
}

module.exports = {
  resolveModuleMapping,
  resolveNodeModulesMapping,
}