# UI List - 高性能虚拟化列表组件

这个项目提供了高性能的虚拟化列表组件，支持 React 和 React Native 两个平台，使用 Rollup 进行多入口点构建。

## 功能特性

- 🚀 **高性能虚拟化**：基于回收策略的列表渲染，支持大量数据
- 📱 **跨平台支持**：同时支持 React Web 和 React Native
- 🔄 **智能回收**：自动回收不可见项，减少内存占用
- 📏 **灵活布局**：支持垂直和水平滚动
- 🎯 **精确滚动**：集成滚动追踪，提供精确的滚动指标
- 🎨 **类型安全**：完整的 TypeScript 支持

## 构建配置

### 项目结构

```
ui/list/
├── src/
│   ├── react/
│   │   ├── List.tsx           # React Web 列表组件
│   │   ├── RecycleItem.tsx    # 回收项组件
│   │   ├── SpaceItem.tsx      # 空间项组件
│   │   ├── types/             # 类型定义
│   │   └── index.ts           # React 入口
│   ├── react-native/
│   │   ├── List.tsx           # React Native 列表组件
│   │   ├── RecycleItem.tsx    # 回收项组件
│   │   ├── SpaceItem.tsx      # 空间项组件
│   │   ├── types/             # 类型定义
│   │   └── index.ts           # React Native 入口
│   └── types/                 # 共享类型定义
├── rollup.config.js           # Rollup 配置文件
├── project.json               # Nx 项目配置
├── package.json               # 包配置
└── jest.config.ts             # Jest 测试配置
```

### Rollup 配置要点

1. **多入口点配置**：

   ```javascript
   module.exports = {
     input: ['ui/list/src/react-native/index.ts', 'ui/list/src/react/index.ts'],
     output: {
       dir: 'dist/ui/list',
       entryFileNames: (chunk) => {
         if (chunk.facadeModuleId.endsWith('src/react-native/index.ts')) {
           return 'react-native.esm.js';
         }
         if (chunk.facadeModuleId.endsWith('src/react/index.ts')) {
           return 'react.esm.js';
         }
       },
     },
   };
   ```

2. **输出格式**：支持 CommonJS 和 ES 模块格式
3. **外部依赖处理**：自动处理 React、React Native 等外部依赖

## 构建方法

### 方法 1: 使用 Nx（推荐）

```bash
npx nx build list
```

### 方法 2: 直接使用 Rollup

```bash
cd ui/list
npx rollup -c rollup.config.js
```

### 方法 3: 使用项目配置

```bash
npx nx run list:build
```

## 输出文件

构建完成后，在 `dist/ui/list/` 目录下会生成：

- `react-native.esm.js` - React Native 版本的 ES 模块
- `react-native.cjs.js` - React Native 版本的 CommonJS 模块
- `react.esm.js` - React Web 版本的 ES 模块
- `react.cjs.js` - React Web 版本的 CommonJS 模块
- `react-native.esm.d.ts` - React Native 类型定义
- `react.esm.d.ts` - React Web 类型定义
- `package.json` - 包配置文件

## 包导出配置

```json
{
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
  }
}
```

## 使用方式

### React Web 项目

```typescript
import { List } from '@infinite-list/list/react';

const MyList = () => (
  <List
    data={items}
    renderItem={({ item }) => <div>{item.name}</div>}
    getItemLayout={(item, index) => ({
      width: 100,
      height: 50,
    })}
  />
);
```

### React Native 项目

```typescript
import { List } from '@infinite-list/list/react-native';

const MyList = () => (
  <List
    data={items}
    renderItem={({ item }) => <Text>{item.name}</Text>}
    getItemLayout={(item, index) => ({
      width: 100,
      height: 50,
    })}
  />
);
```

## 核心组件

### List 组件

主要的列表组件，负责：

- 虚拟化渲染逻辑
- 滚动事件处理
- 状态管理
- 回收策略执行

### RecycleItem 组件

处理可回收的列表项：

- 动态渲染可见项
- 处理项的生命周期
- 优化渲染性能

### SpaceItem 组件

处理空间占位项：

- 维护列表布局
- 提供滚动空间
- 支持动态高度

## 依赖关系

```json
{
  "dependencies": {
    "@infinite-list/dimensions-model": "workspace:*",
    "@infinite-list/item-meta": "workspace:*",
    "@infinite-list/list-dimensions": "workspace:*",
    "@infinite-list/scroller": "workspace:*",
    "@infinite-list/strategies": "workspace:*",
    "@infinite-list/types": "workspace:*",
    "@x-oasis/select-value": "^0.1.14"
  }
}
```

## 测试

运行测试：

```bash
npx nx test list
```

## 注意事项

1. **性能优化**：组件使用虚拟化技术，适合处理大量数据
2. **内存管理**：自动回收不可见项，减少内存占用
3. **滚动集成**：需要配合 `@infinite-list/scroller` 使用
4. **类型安全**：完整的 TypeScript 支持，提供良好的开发体验
5. **平台差异**：React Native 版本使用原生滚动组件，Web 版本使用 DOM 滚动

## 开发指南

1. **添加新功能**：在对应的平台目录下添加组件
2. **类型定义**：在 `types/` 目录下维护类型定义
3. **测试覆盖**：确保新功能有对应的测试用例
4. **文档更新**：及时更新 README 和类型注释
