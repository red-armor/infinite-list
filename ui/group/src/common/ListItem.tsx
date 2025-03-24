import React, {
  ForwardedRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { ItemLayout } from '@infinite-list/types';
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
    children,
    forwardRef,
    recycleItemContainerKey,
    dimensions,
    CellRendererComponent,
    onMeasureLayout: _onMeasureLayout,
    itemMeta,
    ListItemWrapper,
    ...rest
  } = props;

  const itemMetaRef = useRef(itemMeta);
  const itemChangeHandlerRef = useRef<Function | null>();

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
        if (itemChangeHandlerRef.current) itemChangeHandlerRef.current();
      }
    }
  }, [itemMeta]);

  const addItemChangedListener = useCallback((fn: Function) => {
    itemChangeHandlerRef.current = fn;
    return () => {
      itemChangeHandlerRef.current = null;
    };
  }, []);

  const setDimensionItemLayout = useCallback(
    (key: string, layout: ItemLayout) => {
      itemMetaRef.current.getOwner().setKeyItemLayout(key, layout);
    },
    []
  );

  return (
    <ListItemWrapper
      addItemChangedListener={addItemChangedListener}
      setDimensionItemLayout={setDimensionItemLayout}
      key={recycleItemContainerKey}
      itemMeta={itemMeta}
      dimensions={dimensions}
      recycleItemContainerKey={recycleItemContainerKey}
      {...rest}
    >
      {children}
    </ListItemWrapper>
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
