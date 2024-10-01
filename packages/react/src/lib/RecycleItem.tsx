import { useEffect, useMemo, useRef } from 'react';
import { RecycleItemProps } from './types';

const RecycleItem = (props: RecycleItemProps) => {
  const { data, dimensions, renderItem: RenderItem } = props;
  const itemRef = useRef<HTMLDivElement>(null);
  const { item, key, itemMeta, offset } = data;
  const style = useMemo(() => {
    if (offset)
      return {
        position: 'absolute',
        top: offset,
        left: 0,
        right: 0,
      };
  }, [offset]);

  useEffect(() => {
    const rect = itemRef.current?.getBoundingClientRect();
    if (rect) {
      const { height } = rect;
      console.log('======', itemMeta, itemMeta?.getKey(), rect?.height);

      if (itemMeta) dimensions.setFinalKeyItemLayout(itemMeta.getKey(), height);
    }
  }, [itemMeta]);

  return (
    <div ref={itemRef} key={key} style={style}>
      <RenderItem item={item!} itemMeta={itemMeta!} />
    </div>
  );
};

export default RecycleItem;
