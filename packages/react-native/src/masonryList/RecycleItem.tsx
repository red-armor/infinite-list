import { useEffect, useMemo, useRef } from 'react';
import { GenericItemT } from '@infinite-list/data-model';
import { RecycleItemProps } from './types';
import { View, ViewStyle } from 'react-native';

const RecycleItem = <ItemT extends GenericItemT>(
  props: RecycleItemProps<ItemT>
) => {
  const { data, dimensions, renderItem: RenderItem, columnDimension } = props;
  const itemRef = useRef<View>(null);
  const { item, key, itemMeta, offset } = data;
  const style: ViewStyle = useMemo(() => {
    if (typeof offset === 'number')
      return {
        position: 'absolute',
        top: offset,
        // left: 0,
        with: columnDimension.width,
        left: columnDimension.left,
        right: 0,
      };
    return {};
  }, [offset, columnDimension]);

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

  return (
    <View ref={itemRef} key={key} style={style} data-id={key}>
      <RenderItem item={item!} itemMeta={itemMeta!} key={key} />
    </View>
  );
};

export default RecycleItem;
