import { GenericItemT, ItemLayout } from '@infinite-list/types';
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { CompatListItemProps } from './types';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { measureLayout } from './measure';

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
    containerRef,
    itemMeta,
    ...rest
  } = props;
  const containerStyle = useMemo(
    () => StyleSheet.flatten([_style, { elevation: 0 }]),
    [_style]
  );
  const _updateItemLayout = useCallback((layout: ItemLayout) => {
    const { x, y, width, height } = layout;
    setDimensionItemLayout(itemMetaRef.current.getKey(), {
      x,
      y,
      width,
      height,
    });
  }, []);

  const updateItemLayout = useCallback(() => {
    measureLayout(
      viewRef.current,
      containerRef.current,
      measureLayoutOnSuccessCallback
    );
  }, []);

  const measureLayoutOnSuccessCallback = useCallback(
    (x: number, y: number, width: number, height: number) => {
      _updateItemLayout({ x, y, width, height });
    },
    []
  );

  const defaultRef = useRef<HTMLDivElement>(null);
  const viewRef = forwardRef || defaultRef;

  const itemMetaRef = useRef(itemMeta);

  if (itemMetaRef.current !== itemMeta) {
    itemMetaRef.current = itemMeta;
  }

  useEffect(
    () =>
      addItemChangedListener(() => {
        updateItemLayout();
      }),
    []
  );

  const layoutHandler = useMemo(
    () => (e: LayoutChangeEvent) => {
      // if (typeof onLayout === 'function') onLayout(e);
      _updateItemLayout(e.nativeEvent.layout);
    },
    []
  );

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
      key={recycleItemContainerKey}
      {...refProps}
      {...rest}
      style={containerStyle}
    >
      {children}
    </RenderComponent>
  );
};

export default CompatListItem;
