import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { GenericItemT } from '@infinite-list/data-model';
import { SpaceItemProps } from './types';

const Item = <ItemT extends GenericItemT>(props: SpaceItemProps<ItemT>) => {
  const { data, dimensions, renderItem: RenderItem, columnDimension } = props;
  const itemRef = useRef<View>(null);
  const { item, key, itemMeta, length, isSpace } = data;
  const style = useMemo(() => {
    if (isSpace) return { height: length };
    return {
      width: columnDimension.width,
      left: columnDimension.left,
    };
  }, [length]);

  useEffect(() => {
    const onMeasureSuccess = (left, top, width, height) => {
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
      console.error('[measureLayout error] ', itemMeta?.getKey());
    };

    setTimeout(() => {
      itemRef.current.measureLayout(
        // @ts-ignore
        containerRef.current,
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
