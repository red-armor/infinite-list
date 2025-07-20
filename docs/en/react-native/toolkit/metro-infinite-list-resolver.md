# metro-infinite-list-resolver

A Metro resolver utility for the Infinite List project that helps resolve module mappings for monorepo packages. This tool analyzes package.json files and creates mapping records for efficient module resolution in Metro bundler configurations.

This component exists because when packages like `@infinite-list/list` and `@infinite-list/masonry` export their modules, they use the `exports` field to specify whether to export the `react` or `react-native` version. For example:

```json 
// in list/package.json

{
  "name": "@infinite-list/list",
  "exports": {
    "./react": {
      "types": "./react.esm.d.ts",
      "default": "./react.esm.js"
    },
    "./react-native": {
      "types": "./react-native.esm.d.ts",
      "import": "./react-native.esm.js",
      "default": "./react-native.esm.js"
    }
  },
}
```

When you try to import these modules, you'll get an error because the `exports` field is not supported in older versions of Metro. For more details, see:
- [Package Exports Support (New)](https://metrobundler.dev/docs/package-exports/)
- [Package Exports not working #1128](https://github.com/facebook/metro/issues/1128)

This means that to use `@infinite-list/list` and other components normally in React Native, you need to include this resolver so that Metro can correctly resolve `@infinite-list/*` components.

## Installation

```bash
npm install @infinite-list/metro-infinite-list-resolver
```

## Usage

### Basic Usage

```javascript
import { resolveModules } from '@infinite-list/metro-infinite-list-resolver';

const mapping = resolveModules({
  rootPath: path.join(__dirname, 'node_modules'),
  targetDir: '@infinite-list',
})

// Output: 
// {
//   '@infinite-list/list/react': './path/to/node_modules/@infinite-list/.ignored_list/react.esm.js',
//   '@infinite-list/list/react-native': './path/to/node_modules/@infinite-list/.ignored_list/react-native.esm.js',
//   '@x-oasis/select-value': './path/to/node_modules/@x-oasis/select-value/dist/select-value.esm.js',
//   '@infinite-list/dimensions-model': './path/to/node_modules/@infinite-list/dimensions-model/index.esm.js',
//   '@x-oasis/default-boolean-value': './path/to/node_modules/@x-oasis/default-boolean-value/dist/default-boolean-value.esm.js',
//   '@x-oasis/default-value': './path/to/node_modules/@x-oasis/default-value/dist/default-value.esm.js',
//   '@x-oasis/layout-equal': './path/to/node_modules/@x-oasis/layout-equal/dist/layout-equal.esm.js',
//   '@x-oasis/prefix-interval-tree': './path/to/node_modules/@x-oasis/prefix-interval-tree/dist/prefix-interval-tree.esm.js',
//   '@x-oasis/recycler': './path/to/node_modules/@x-oasis/recycler/dist/recycler.esm.js',
//   ......
// }
```

## API Reference

### `resolveModules(options?: ResolveModulesOptions): MappingRecord | undefined`

Main function that resolves all modules in a target directory.

#### Parameters

- `options` (optional): Configuration object
  - `rootPath` (string, optional): Root directory path. Defaults to current directory
  - `targetDir` (string, required): Target directory containing packages to resolve
  - `resolveModulePath` (function, optional): Custom module resolution function

#### Returns

- `MappingRecord`: Object mapping package names to their resolved file paths
- `undefined`: If target directory doesn't exist or other errors occur

### `cleanPackagePath(packagePath: string): string`

Utility function that cleans package paths by removing unnecessary `./` parts and handling `../` backtracks.

#### Parameters

- `packagePath` (string): The package path to clean

#### Returns

- `string`: Cleaned package path

## Types

### `ResolveModulesOptions`

```typescript
interface ResolveModulesOptions {
  rootPath?: string;
  targetDir: string;
  resolveModulePath?: ResolveModulePath;
}
```

### `MappingRecord`

```typescript
interface MappingRecord {
  [key: string]: string;
}
```

### `PkgOptions`

```typescript
interface PkgOptions {
  main: string;
  module?: string;
  exports?: {
    [key: string]: {
      import?: string;
      default?: string;
      types?: string;
    };
  };
}
```

## Metro Integration

This resolver is designed to work with Metro bundler's `resolver.resolveRequest` configuration:

```javascript
// metro.config.js
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
```

## License

MIT
