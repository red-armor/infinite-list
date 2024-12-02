import { useEffect, useMemo, useRef } from 'react';
import { GenericItemT } from '@infinite-list/data-model';
import { SpaceItemProps } from './types';

const Item = <ItemT extends GenericItemT>(props: SpaceItemProps<ItemT>) => {
  const { data, dimensions, renderItem: RenderItem, columnDimension } = props;
  const itemRef = useRef<HTMLDivElement>(null);
  const { item, key, itemMeta, length, isSpace } = data;
  const style = useMemo(() => {
    if (isSpace)
      return {
        width: columnDimension.width,
        height: length,
      };
    return {
      width: columnDimension.width,
      left: columnDimension.left,
    };
  }, [length]);

  useEffect(() => {
    const rect = itemRef.current?.getBoundingClientRect();

    if (rect) {
      const { height } = rect;
      if (itemMeta) dimensions.setFinalKeyItemLayout(itemMeta.getKey(), height);
    }
  }, [itemMeta]);

  if (isSpace) {
    return <div style={style} />;
  }

  return (
    <div ref={itemRef} key={key} style={style}>
      <RenderItem item={item!} itemMeta={itemMeta!} />
    </div>
  );
};

export default Item;
