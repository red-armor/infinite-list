import { CSSProperties, useEffect, useMemo, useRef } from 'react';
import { GenericItemT } from '@infinite-list/strategies';

import { RecycleItemProps } from '../types';

const RecycleItem = <ItemT extends GenericItemT>(
  props: RecycleItemProps<ItemT>
) => {
  const { data, dimensions, renderItem: RenderItem, horizontal } = props;
  const itemRef = useRef<HTMLDivElement>(null);
  const { item, key, itemMeta, offset } = data;
  const style: CSSProperties = useMemo(() => {
    if (typeof offset !== 'number') return {};
    if (horizontal) {
      return {
        position: 'absolute',
        transform: `translateX(${offset}px)`,
        left: 0,
        top: 0,
        bottom: 0,
      };
    }
    return {
      position: 'absolute',
      transform: `translateY(${offset}px)`,
      left: 0,
      top: 0,
      right: 0,
    };
  }, [offset]);

  useEffect(() => {
    const rect = itemRef.current?.getBoundingClientRect();
    /**
     * passing rect, then selectValue will choose the correct length...
     * horizontal is true, then will be rect.width, or it will be rect.height
     */
    if (rect) {
      if (itemMeta) dimensions.setFinalKeyItemLayout(itemMeta.getKey(), rect);
    }
  }, [itemMeta]);

  return (
    <div ref={itemRef} key={key} style={style} data-id={key}>
      <RenderItem item={item!} itemMeta={itemMeta!} key={key} />
    </div>
  );
};

export default RecycleItem;
