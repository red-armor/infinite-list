# metro-infinite-list-resolver

一个用于 Infinite List 项目的 Metro 解析器工具，帮助解析 monorepo 包的模块映射。该工具分析 package.json 文件并创建映射记录，以便在 Metro 打包器配置中进行高效的模块解析。

之所以，有这个组件的存在，是因为在比如 `@infinite-list/list`, `@infinite-list/masonry`对外进行exports时使用了 `exports` 来指定到底抛出的是 `react` 还是 `react-native`所使用的。比如下面的例子

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

当你进行引入的时候会报错，因为 `exports` field 在比较老的 `metro` 版本是不支持的，具体可以参考
- [Package Exports Support (New)](https://metrobundler.dev/docs/package-exports/)
- [Package Exports not working #1128](https://github.com/facebook/metro/issues/1128)

也就是说如果想要在 `react-native` 中正常使用 `@infinite-list/list`等这些组件，需要引入当前 resolver 让 metro 能够正确的解析到 `@infinite-list/*` 组件

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
## API 参考

### `resolveModules(options?: ResolveModulesOptions): MappingRecord | undefined`

解析目标目录中所有模块的主函数。

#### 参数

- `options` (可选): 配置对象
  - `rootPath` (string, 可选): 根目录路径。默认为当前目录
  - `targetDir` (string, 必需): 包含要解析的包的目标目录
  - `resolveModulePath` (function, 可选): 自定义模块解析函数

#### 返回值

- `MappingRecord`: 将包名映射到其解析文件路径的对象
- `undefined`: 如果目标目录不存在或发生其他错误

### `cleanPackagePath(packagePath: string): string`

通过移除不必要的 `./` 部分和处理 `../` 回溯来清理包路径的工具函数。

#### 参数

- `packagePath` (string): 要清理的包路径

#### 返回值

- `string`: 清理后的包路径

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

此解析器设计用于与 Metro 打包器的 `resolver.resolveRequest` 配置配合工作：

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


