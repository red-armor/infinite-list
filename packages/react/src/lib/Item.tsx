import { useEffect, useMemo, useRef } from 'react';
import { ItemProps } from './types';

const Item = (props: ItemProps) => {
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
  const itemMetaRef = useRef(itemMeta);

  useEffect(() => {
    const rect = itemRef.current?.getBoundingClientRect();
    if (rect) {
      const { height } = rect;
      dimensions.setFinalKeyItemLayout(itemMetaRef.current.getKey(), height);
    }
  }, []);

  return (
    <div ref={itemRef} key={key} style={style}>
      <RenderItem item={item!} itemMeta={itemMeta!} />
    </div>
  );
};

export default Item;
