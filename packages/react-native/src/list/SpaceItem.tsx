import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { SpaceItemProps } from './types';

const Item = (props: SpaceItemProps) => {
  const { data, dimensions, renderItem: RenderItem, containerRef } = props;
  const itemRef = useRef<View>(null);
  const { item, key, itemMeta, length, isSpace } = data;
  const style = useMemo(
    () => ({
      height: length,
    }),
    [length]
  );

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
