import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import type { GenericItemT } from '@infinite-list/item-meta';
import type { SpaceItemProps } from './types';

const Item = <ItemT extends GenericItemT>(props: SpaceItemProps<ItemT>) => {
  const {
    data,
    dimensions,
    renderItem: RenderItem,
    columnDimension,
    containerRef,
  } = props;
  const itemRef = useRef<View>(null);
  const { item, key, itemMeta, length, isSpace } = data;
  const style = useMemo(() => {
    if (isSpace)
      return {
        height: length,
        width: columnDimension.width,
        transform: [
          {
            translateX: columnDimension.left,
          },
        ],
      };

    return {
      width: columnDimension.width,
      transform: [
        {
          translateX: columnDimension.left,
        },
      ],
    };
  }, [length, columnDimension]);

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
    <View ref={itemRef} key={key} style={style}>
      <RenderItem item={item!} itemMeta={itemMeta!} />
    </View>
  );
};

export default Item;
