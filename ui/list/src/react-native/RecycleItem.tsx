import { useEffect, useMemo, useRef } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import type { GenericItemT } from '@infinite-list/types';
import type { RecycleItemProps } from './types';

const RecycleItem = <ItemT extends GenericItemT>(
  props: RecycleItemProps<ItemT>
) => {
  const {
    data,
    dimensions,
    renderItem: RenderItem,
    scrollerRef,
    horizontal,
  } = props;
  const itemRef = useRef<View>(null);
  const { item, key, itemMeta, offset } = data;

  const style: ViewStyle = useMemo(() => {
    if (typeof offset !== 'number') return {};

    if (horizontal) {
      return {
        position: 'absolute',
        transform: [
          {
            translateX: offset,
          },
        ],
        left: 0,
        top: 0,
        bottom: 0,
      };
    }
    return {
      position: 'absolute',
      transform: [
        {
          translateY: offset,
        },
      ],
      left: 0,
      top: 0,
      right: 0,
    };
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
        // @ts-expect-error
        scrollerRef.current,
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
