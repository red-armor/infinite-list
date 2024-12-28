import { GenericItemT } from '@infinite-list/types';
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  FC,
} from 'react';
import { CompatListItemProps } from './types';

const CompatListItem = <ItemT extends GenericItemT>(
  props: PropsWithChildren<CompatListItemProps<ItemT>>
) => {
  const {
    style: _style = {},
    children,
    forwardRef,

    dimensions,
    recycleItemContainerKey,
    CellRendererComponent,
    onMeasureLayout: _onMeasureLayout,
    setDimensionItemLayout,
    addItemChangedListener,
    itemMeta,
    ...rest
  } = props;

  const defaultRef = useRef<HTMLDivElement>(null);
  const viewRef = forwardRef || defaultRef;

  const updateItemLayout = useCallback(() => {
    // @ts-ignore
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
    <RenderComponent
      key={recycleItemContainerKey}
      {...refProps}
      {...rest}
      style={_style}
    >
      {children}
    </RenderComponent>
  );
};

export default CompatListItem;
