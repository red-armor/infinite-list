import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import type { GenericItemT } from '@infinite-list/types';
import type { RecycleItemProps } from './types';

const RecycleItem = <ItemT extends GenericItemT>(
  props: RecycleItemProps<ItemT>
) => {
  const { data, dimensions, renderItem: RenderItem, columnDimension } = props;
  const itemRef = useRef<HTMLDivElement>(null);
  const { item, key, itemMeta, offset } = data;
  const style: CSSProperties = useMemo(() => {
    if (typeof offset === 'number')
      return {
        position: 'absolute',
        top: offset,
        // left: 0,
        width: columnDimension.width,
        left: columnDimension.left,
        right: columnDimension.right,
      };
    return {};
  }, [offset, columnDimension]);

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
