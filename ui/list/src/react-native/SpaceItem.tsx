import type { GenericItemT } from '@infinite-list/types';
import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

import type { SpaceItemProps } from './types';

const Item = <ItemT extends GenericItemT>(props: SpaceItemProps<ItemT>) => {
  const {
    data,
    dimensions,
    renderItem: RenderItem,
    scrollerRef,
    horizontal,
  } = props;
  const itemRef = useRef<View>(null);
  const { item, key, itemMeta, length, isSpace } = data;
  const style = useMemo(() => {
    if (horizontal) return { width: length };
    return { height: length };
  }, [length]);

  useEffect(() => {
    const onMeasureSuccess = (
      left: number,
      top: number,
      width: number,
      height: number
    ) => {
      if (itemMeta) {
        dimensions.setFinalKeyItemLayout(itemMeta.getKey(), {
          x: left,
          y: top,
          height,
          width,
        });
      }
    };

    const onMeasureFailed = () => {
      console.error('[measureLayout error]', itemMeta?.getKey());
    };

    setTimeout(() => {
      itemRef.current?.measureLayout(
        // @ts-expect-error
        scrollerRef.current,
        onMeasureSuccess,
        onMeasureFailed
      );
    });
  }, [itemMeta]);

  if (isSpace) {
    return <View style={style} ref={itemRef} />;
  }

  return (
    <View ref={itemRef} key={key}>
      <RenderItem item={item!} itemMeta={itemMeta!} />
    </View>
  );
};

export default Item;
