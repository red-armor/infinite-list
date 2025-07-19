# UI Scroller - Vite 多入口点构建

这个项目使用 Vite 进行多入口点构建，支持 React Native 和 Web 两个平台。

## 构建配置

### 项目结构

```
ui/scroller/
├── src/
│   ├── react-native/
│   │   └── index.ts          # React Native 入口
│   └── web/
│       └── index.ts          # Web 入口
├── vite.config.ts            # Vite 配置文件
├── vitest.config.ts          # Vitest 测试配置
├── project.json              # Nx 项目配置
├── package.json              # 包配置
└── build.sh                  # 构建脚本
```

### Vite 配置要点

1. **多入口点配置**：

   ```typescript
   build: {
     lib: {
       entry: {
         'react-native': resolve(__dirname, 'src/react-native/index.ts'),
         'web': resolve(__dirname, 'src/web/index.ts'),
       },
       formats: ['es'],
     },
   }
   ```

2. **输出文件命名**：

   ```typescript
   output: {
     entryFileNames: (chunkInfo) => {
       if (chunkInfo.name === 'react-native') {
         return 'react-native.esm.js';
       }
       if (chunkInfo.name === 'web') {
         return 'web.esm.js';
       }
       return '[name].esm.js';
     },
   }
   ```

3. **外部依赖配置**：
   ```typescript
   external: [
     'react',
     'react-native',
     '@infinite-list/item-meta',
     // ... 其他依赖
   ];
   ```

## 构建方法

### 方法 1: 使用构建脚本（推荐）

```bash
./ui/scroller/build.sh
```

### 方法 2: 直接使用 Vite

```bash
cd ui/scroller
npx vite build --config vite.config.ts --outDir ../../dist/ui/scroller
```

### 方法 3: 使用 Nx（需要解决 TypeScript 配置问题）

```bash
nx build scroller
```

## 输出文件

构建完成后，在 `dist/ui/scroller/` 目录下会生成：

- `react-native.esm.js` - React Native 版本的 ES 模块
- `web.esm.js` - Web 版本的 ES 模块
- `react-native.esm.d.ts` - React Native 类型定义
- `web.esm.d.ts` - Web 类型定义
- `package.json` - 包配置文件

## 包导出配置

```json
{
  "exports": {
    "./web": {
      "types": "./web.esm.d.ts",
      "default": "./web.esm.js"
    },
    "./react-native": {
      "types": "./react-native.esm.d.ts",
      "import": "./react-native.esm.js",
      "default": "./react-native.esm.js"
    }
  }
}
```

## 使用方式

### React Native 项目

```typescript
import { ScrollHelper, ScrollView } from '@infinite-list/scroller/react-native';
```

### Web 项目

```typescript
import { ScrollTracker } from '@infinite-list/scroller/web';
```

## 注意事项

1. **TypeScript 配置**：当前 Nx 构建存在 TypeScript 配置问题，建议使用直接 Vite 构建
2. **依赖管理**：确保所有外部依赖都在 `external` 配置中列出
3. **文件大小**：React Native 版本较大（~96KB），Web 版本较小（~3.4KB）
4. **类型定义**：生成的 `.d.ts` 文件指向源码，确保类型正确导出
