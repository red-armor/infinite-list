import React, {
  ForwardedRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { DefaultItemT, ListItemProps } from '../types';

/**
 *
 * @param Component
 * @returns
 *
 * dimension is required.
 * viewableItemHelperKey is required
 * itemMeta derivate from dimension and viewableItemKey
 * indexInfo derivate from itemMeta
 * viewable
 *
 *
 * Attention: use itemMeta as key!!!, not viewableItemHelperKey;;;
 * Because itemMeta may change, but viewableItemHelperKey not change...
 */
const ListItem = <ItemT extends DefaultItemT>(
  props: PropsWithChildren<ListItemProps<ItemT>>
) => {
  const {
    style: _style = {},
    children,
    onLayout,
    forwardRef,

    dimensions,
    containerKey,
    CellRendererComponent,
    setMeasureLayoutHandler,
    onMeasureLayout: _onMeasureLayout,
    measureLayoutHandlerOnDemand,
    getMetaOnViewableItemsChanged,

    itemMeta,
    ...rest
  } = props;
  const containerStyle = useMemo(() => ({ ..._style, elevation: 0 }), [_style]);

  const defaultRef = useRef<HTMLDivElement>(null);
  const viewRef = forwardRef || defaultRef;

  const itemMetaRef = useRef(itemMeta);

  const layoutHandler = useCallback(() => {
    // @ts-ignore
    const rect = viewRef.current.getBoundingClientRect();
    if (rect) {
      const { x, y, width, height } = rect;
      itemMetaRef.current
        .getOwner()
        .setKeyItemLayout(itemMetaRef.current.getKey(), {
          x,
          y,
          width,
          height,
        });
    }
  }, []);

  useEffect(() => {
    layoutHandler();
  }, []);

  // note!!!!: has a condition, viewableItemHelperKey not change but itemMeta change..
  // reuse position with same data source..
  useEffect(() => {
    // ignore first time
    if (itemMetaRef.current !== itemMeta) {
      itemMetaRef.current = itemMeta;

      // isApproximateLayout is true should trigger calculate layout again.
      if (
        itemMetaRef.current &&
        (!itemMetaRef.current?.getLayout() ||
          itemMetaRef.current.isApproximateLayout)
      ) {
        setTimeout(() => layoutHandler(), 0);
      }
    }
  }, [itemMeta]);

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

// generic forwardRef https://gist.github.com/IrvingArmenta/a6d7fc76ed538697ad18b7f074accdde
// https://www.totaltypescript.com/forwardref-with-generic-components
export default React.forwardRef(
  <ItemT extends DefaultItemT>(
    props: ListItemProps<ItemT>,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    return <ListItem {...props} forwardRef={ref} />;
  }
) as <ItemT extends DefaultItemT>(
  props: ListItemProps<ItemT>,
  ref: ForwardedRef<HTMLDivElement>
) => ReturnType<typeof ListItem>;
