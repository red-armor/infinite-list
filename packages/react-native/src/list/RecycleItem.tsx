import type { GenericItemT } from '@infinite-list/data-model';
import { useEffect, useMemo, useRef } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';

import type { RecycleItemProps } from './types';

const RecycleItem = <ItemT extends GenericItemT>(
  props: RecycleItemProps<ItemT>
) => {
  const { data, dimensions, renderItem: RenderItem, containerRef } = props;
  const itemRef = useRef<View>(null);
  const { item, key, itemMeta, offset } = data;
  const style: ViewStyle = useMemo(() => {
    if (offset)
      return {
        position: 'absolute',
        top: offset,
        left: 0,
        right: 0,
      };
    return {};
  }, [offset]);

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

  return (
    <View ref={itemRef} key={key} style={style} data-id={key}>
      <RenderItem item={item!} itemMeta={itemMeta!} key={key} />
    </View>
  );
};

export default RecycleItem;
