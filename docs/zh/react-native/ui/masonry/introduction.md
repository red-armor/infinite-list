# Masonry

针对React Native的Masonry组件，支持Recycler，允许用户自定义配置recycler渲染策略，确保最佳的滑动体感；它有下列特点

- 支持Recycler，item的渲染是重复使用的过程，确保整体的流畅度
- 支持不定高，可以不设置item的高度组建自动计算
- 支持可控的多列展示

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

## Usage

```tsx
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  MasonryList, 
  RenderItem 
} from '@infinite-list/masonry/react-native';
import { ScrollView } from '@infinite-list/scroller/react-native';
import { Text, View } from 'react-native';

const buildData = (count: number, startIndex = 0) =>
  new Array(count).fill(1).map((v, index) => ({
    key: index + startIndex,
    value: index + startIndex,
  }));

export default () => {
  const data = useMemo(() => buildData(1500), []);
  const scrollViewRef = useRef<ScrollView>(null);

  const renderItem:  RenderItem<{
    key: number;
    value: number;
  }> = useCallback((props) => {
    const { item, itemMeta } = props;
    const index = itemMeta.getIndexInfo().index;
    const totalIndex = itemMeta.getIndexInfo().indexInTotal;

    return (
      <View
        style={{
          height: totalIndex % 3 ? 50 : 75,
          flex: 1,
          width: '100%',
          backgroundColor: index % 2 ? '#fff' : '#eee',
        }}
      >
        <Text>{item.value}</Text>
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item) => {
    return item.key;
  }, []);

  return (
    <ScrollView ref={scrollViewRef}>
      <MasonryList
        data={data}
        renderItem={renderItem}
        id="basic"
        keyExtractor={keyExtractor}
        containerRef={scrollViewRef}
      />
    </ScrollView>
  );
};

```

## Compatible Props

### data
- Type: `Array<ItemT>`
- Default: `[]`

渲染列表所对应的数据

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

### keyExtractor

- Type: 
```typescript
(item: any, index: number) => string
```

## Special Props

### recyclerBufferSize
- Type: `number`

### recyclerReservedBufferPerBatch
- Type: `number`

### containerRef