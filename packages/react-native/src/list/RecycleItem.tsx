import { CSSProperties, useEffect, useMemo, useRef } from 'react';
import { RecycleItemProps } from './types';

const RecycleItem = (props: RecycleItemProps) => {
  const { data, dimensions, renderItem: RenderItem } = props;
  const itemRef = useRef<HTMLDivElement>(null);
  const { item, key, itemMeta, offset } = data;
  const style: CSSProperties = useMemo(() => {
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
    const rect = itemRef.current?.getBoundingClientRect();
    if (rect) {
      const { height } = rect;

      if (itemMeta) dimensions.setFinalKeyItemLayout(itemMeta.getKey(), height);
    }
  }, [itemMeta]);

  return (
    <div ref={itemRef} key={key} style={style} data-id={key}>
      <RenderItem item={item!} itemMeta={itemMeta!} key={key} />
    </div>
  );
};

export default RecycleItem;
