import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { GenericItemT } from '@infinite-list/types';
import { CompatListItemProps } from './types';

const CompatListItem = <ItemT extends GenericItemT>(
  props: PropsWithChildren<CompatListItemProps<ItemT>>
) => {
  const {
    style: _style = {},
    children,
    forwardRef,
    recycleItemContainerKey,
    CellRendererComponent,
    onMeasureLayout: _onMeasureLayout,
    setDimensionItemLayout,
    addItemChangedListener,
    itemMeta,
  } = props;

  const defaultRef = useRef<HTMLDivElement>(null);
  const viewRef = forwardRef || defaultRef;

  const updateItemLayout = useCallback(() => {
    // @ts-expect-error [TODO]
    const rect = viewRef?.current?.getBoundingClientRect();
    if (rect) {
      const { x, y, width, height } = rect;
      setDimensionItemLayout(itemMetaRef.current.getKey(), {
        x,
        y,
        width,
        height,
      });
    }
  }, []);

  useEffect(() => addItemChangedListener(updateItemLayout), []);

  const itemMetaRef = useRef(itemMeta);

  if (itemMetaRef.current !== itemMeta) {
    itemMetaRef.current = itemMeta;
  }

  useEffect(() => {
    updateItemLayout();
  }, []);

  const RenderComponent = useMemo(
    () => CellRendererComponent || 'div',
    [CellRendererComponent]
  );

  // TODO: temp fix
  // Warning: Function components cannot be given refs. Attempts to
  // access this ref will fail. Did you mean to use React.forwardRef()?
  const refProps = useMemo(() => {
    if (CellRendererComponent)
      return {
        cellKey: itemMeta.getKey(),
      };
    return { ref: viewRef };
  }, [itemMeta]);

  return (
    <RenderComponent key={recycleItemContainerKey} {...refProps} style={_style}>
      {children}
    </RenderComponent>
  );
};

export default CompatListItem;
