import { GenericItemT } from '@infinite-list/types';
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { CompatListItemProps } from './types';

const CompatListItem = <ItemT extends GenericItemT>(
  props: PropsWithChildren<CompatListItemProps<ItemT>>
) => {
  const {
    style: _style = {},
    children,
    onLayout,
    forwardRef,

    dimensions,
    containerKey,
    CellRendererComponent,
    onMeasureLayout: _onMeasureLayout,
    setDimensionItemLayout,
    onItemChanged,
    itemMeta,
    ...rest
  } = props;

  const updateItemLayout = useCallback(() => {
    const rect = viewRef.current.getBoundingClientRect();
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

  useEffect(() => {
    return onItemChanged(updateItemLayout);
  }, []);

  // const containerStyle = useMemo(() => ({ ..._style, elevation: 0 }), [_style]);

  const defaultRef = useRef<HTMLDivElement>(null);
  const viewRef = forwardRef || defaultRef;

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
      // onLayout={layoutHandler}
      key={containerKey}
      {...refProps}
      {...rest}
      // @ts-ignore
      style={containerStyle}
    >
      {children}
      {/* <Text style={{ position: 'absolute', right: 20, top: 0, color: 'red' }}>
        {props.itemMeta.getIndexInfo()?.indexInGroup}
      </Text> */}
    </RenderComponent>
  );
};

export default CompatListItem;
