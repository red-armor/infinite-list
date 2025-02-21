# MasonryList

A responsive and customizable Masonry List component for React Native applications. This component allows you to display items in a grid layout, where items can have varying heights

## Installation

::: code-group
```sh [npm]
$ npm i @infinite-list/masonry/react-native
```

```sh [pnpm]
$ pnpm add @infinite-list/masonry/react-native
```

```sh [yarn]
$ yarn add @infinite-list/masonry/react-native
```

:::


## Props

### data
- Type: `Array<ItemT>`

The data to be displayed in the list.

### renderItem
- Type

```ts
type RenderItemInfo<ItemT extends GenericItemT = GenericItemT> = {
  item: ItemT;
  itemMeta: ItemMeta<ItemT>;
};

type DefaultItemT = {
  [key: string]: any;
};

type RenderItem<ItemT extends DefaultItemT> = (
  info: RenderItemInfo<ItemT>
) => React.ReactElement | null;
```
The function to render each item in the list.

### recyclerBufferSize
- Type: `number`

### recyclerReservedBufferPerBatch
- Type: `number`

### keyExtractor

- Type: 
```typescript
(item: any, index: number) => string
```


### containerRef