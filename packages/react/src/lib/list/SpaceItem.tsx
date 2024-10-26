import { useEffect, useMemo, useRef } from 'react';
import { SpaceItemProps } from './types';

const Item = (props: SpaceItemProps) => {
  const { data, dimensions, renderItem: RenderItem } = props;
  const itemRef = useRef<HTMLDivElement>(null);
  const { item, key, itemMeta, length, isSpace } = data;
  const style = useMemo(
    () => ({
      height: length,
    }),
    [length]
  );

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
    <div ref={itemRef} key={key}>
      <RenderItem item={item!} itemMeta={itemMeta!} />
    </div>
  );
};

export default Item;
