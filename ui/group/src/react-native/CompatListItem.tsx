import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { GenericItemT, ItemLayout } from '@infinite-list/types';
import { measureLayout } from './measure';
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
    containerRef,
    itemMeta,
    item,
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
      // @ts-ignore [TODO]
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
      style={containerStyle}
    >
      {children}
    </RenderComponent>
  );
};

export default CompatListItem;
