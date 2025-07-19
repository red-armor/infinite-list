# metro-infinite-list-resolver

A Metro resolver utility for the Infinite List project that helps resolve module mappings for monorepo packages. This tool analyzes package.json files and creates mapping records for efficient module resolution in Metro bundler configurations.

## Features

- **Automatic Package Discovery**: Scans target directories to find all packages
- **Export Mapping**: Resolves package exports and creates proper import mappings
- **Dependency Resolution**: Recursively processes dependencies to build complete mapping trees
- **Path Cleaning**: Handles complex path scenarios including scoped packages and relative paths
- **Flexible Configuration**: Supports custom resolution strategies through plugins

## Installation

```bash
npm install @infinite-list/metro-infinite-list-resolver
```

## Usage

### Basic Usage

```javascript
import { resolveModules } from '@infinite-list/metro-infinite-list-resolver';

const mapping = resolveModules({
  rootPath: '/path/to/your/project',
  targetDir: 'packages',
});

console.log(mapping);
// Output: {
//   '@infinite-list/core': '/path/to/your/project/packages/core/index.js',
//   '@infinite-list/react': '/path/to/your/project/packages/react/index.js',
//   ...
// }
```

### Advanced Usage with Custom Resolution

```javascript
import { resolveModules } from '@infinite-list/metro-infinite-list-resolver';

const customResolveModulePath = (pkgOptions, packageName, modulePath) => {
  const mapping = {};

  // Custom logic for resolving modules
  if (pkgOptions.exports) {
    for (const [key, value] of Object.entries(pkgOptions.exports)) {
      if (value.import) {
        mapping[`${packageName}/${key}`] = path.join(modulePath, value.import);
      }
    }
  }

  return mapping;
};

const mapping = resolveModules({
  rootPath: '/path/to/your/project',
  targetDir: 'packages',
  resolveModulePath: customResolveModulePath,
});
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

## How It Works

1. **Directory Scanning**: Scans the target directory for subdirectories (packages)
2. **Package.json Analysis**: Reads each package's `package.json` file
3. **Export Resolution**: Processes `exports` field to create import mappings
4. **Main/Module Resolution**: Falls back to `main` or `module` fields if exports aren't available
5. **Dependency Processing**: Recursively processes dependencies to build complete mapping tree
6. **Path Cleaning**: Handles complex path scenarios and scoped packages

## Metro Integration

This resolver is designed to work with Metro bundler's `resolver.alias` configuration:

```javascript
// metro.config.js
const {
  resolveModules,
} = require('@infinite-list/metro-infinite-list-resolver');

module.exports = {
  resolver: {
    alias: resolveModules({
      rootPath: __dirname,
      targetDir: 'packages',
    }),
  },
};
```

## Examples

### Monorepo Structure

```
my-project/
├── packages/
│   ├── core/
│   │   ├── package.json
│   │   └── index.js
│   ├── react/
│   │   ├── package.json
│   │   └── index.js
│   └── utils/
│       ├── package.json
│       └── index.js
└── metro.config.js
```

### Generated Mapping

```javascript
{
  '@my-project/core': '/path/to/my-project/packages/core/index.js',
  '@my-project/react': '/path/to/my-project/packages/react/index.js',
  '@my-project/utils': '/path/to/my-project/packages/utils/index.js',
  '@my-project/core/utils': '/path/to/my-project/packages/core/utils.js'
}
```

## Error Handling

The resolver gracefully handles:

- Missing target directories
- Invalid package.json files
- Non-existent dependency paths
- Circular dependencies (prevents infinite loops)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT
