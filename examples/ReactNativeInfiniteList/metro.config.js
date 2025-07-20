const path = require('path');
const { resolveModules } = require('@infinite-list/metro-infinite-list-resolver');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const mapping = resolveModules({
  rootPath: path.join(__dirname, 'node_modules'),
  targetDir: '@infinite-list',
})

config.resolver.extraNodeModules = {
  ...mapping,
};

const { resolver } = config;
config.resolver = {
  ...resolver,
  resolveRequest: (context, moduleName, platform, realModuleName) => {
    for (const k in mapping) {
      if (moduleName === k) {
        return {
          filePath: mapping[k],
          type: 'sourceFile',
        }
      }
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
