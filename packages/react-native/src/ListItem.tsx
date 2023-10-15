import shallowEqual from '@x-oasis/shallow-equal';
import React, {
  ForwardedRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Text, View, StyleSheet } from 'react-native';

// import useMeasureLayout from '../../container/ScrollView/hooks/useMeasureLayoutExperimental';
import { ListItemProps, DefaultItemT } from './types';

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
const ListItem = <T extends DefaultItemT>(
  props: PropsWithChildren<ListItemProps<T>>
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
    scrollComponentUseMeasureLayout,

    itemMeta,
    ...rest
  } = props;
  const containerStyle = useMemo(
    () => StyleSheet.flatten([_style, { elevation: 0 }]),
    [_style]
  );

  const defaultRef = useRef<View>(null);
  const viewRef = forwardRef || defaultRef;

  const itemMetaRef = useRef(itemMeta);

  const onMeasureLayout = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (typeof _onMeasureLayout === 'function') {
        _onMeasureLayout(x, y, width, height);
      }
      const layout = itemMetaRef.current?.getLayout();
      const nextLayout = { x, y, width, height };

      if (!layout || !shallowEqual(nextLayout, layout)) {
        itemMetaRef.current
          .getOwner()
          .setKeyItemLayout(itemMetaRef.current.getKey(), {
            x,
            y,
            width,
            height,
          });
      }
    },
    []
  );

  const getCurrentKey = useCallback(() => itemMetaRef.current.getKey(), []);

  // @ts-ignore
  const { handler, layoutHandler } = scrollComponentUseMeasureLayout(viewRef, {
    onLayout,
    getCurrentKey,
    isIntervalTreeItem: true,
    onMeasureLayout,
  });

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
        setTimeout(() => handler(), 0);
      }
    }
  }, [itemMeta]);

  useEffect(() => {
    if (typeof setMeasureLayoutHandler === 'function')
      setMeasureLayoutHandler(handler);
  }, []);

  const RenderComponent = useMemo(
    () => CellRendererComponent || View,
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
      onLayout={layoutHandler}
      key={containerKey}
      {...refProps}
      {...rest}
      style={containerStyle}
    >
      {children}
      <Text style={{ position: 'absolute', right: 20, top: 0, color: 'red' }}>
        {props.itemMeta.getIndexInfo()?.indexInGroup}
      </Text>
    </RenderComponent>
  );
};

export default React.forwardRef(
  <T extends DefaultItemT>(
    props: ListItemProps<T>,
    ref: ForwardedRef<View>
  ) => {
    return <ListItem {...props} forwardRef={ref} />;
  }
);
