import { CSSProperties, useEffect, useMemo, useRef } from 'react';
// import { GenericItemT } from '@infinite-list/data-model';
import { GenericItemT } from '@infinite-list/strategies';
import { RecycleItemProps } from '../types';

const RecycleItem = <ItemT extends GenericItemT>(
  props: RecycleItemProps<ItemT>
) => {
  const { data, dimensions, renderItem: RenderItem } = props;
  const itemRef = useRef<HTMLDivElement>(null);
  const { item, key, itemMeta, offset } = data;
  const style: CSSProperties = useMemo(() => {
    if (typeof offset === 'number')
      return {
        position: 'absolute',
        transform: `translateY(${offset}px)`,
        left: 0,
        top: 0,
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
