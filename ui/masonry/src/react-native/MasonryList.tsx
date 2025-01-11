import {
  useCallback,
  useState,
  useRef,
  useMemo,
  useEffect,
  forwardRef as ReactForwardRef,
  ForwardedRef,
  useContext,
} from 'react';
import { ItemLayout } from '@infinite-list/types';
import {
  View,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import {
  GenericItemT,
  MasonryDimensions as MasonryDimension,
  MasonryStateResults,
} from '@infinite-list/masonry-dimensions';
import { MasonryListProps } from './types';
import ColumnStateRenderer from './ColumnStateRender';
import { ScrollViewContext } from '@infinite-list/scroller/react-native';
import { resolveColumnInfo } from '../common/utils';

let count = 0;

const MasonryList = <ItemT extends GenericItemT>(
  props: MasonryListProps<ItemT>
) => {
  const [state, setState] = useState<MasonryStateResults<ItemT>>();
  const {
    id,
    data,
    column = 2,
    getColumnWidth,
    horizontal = false,
    getContainerLayout,
    forwardRef,
    ...rest
  } = props;
  const contextValues = useContext(ScrollViewContext);

  const listId = useMemo(() => id || `__masonry_list${count++}__`, []);

  const nextResolveColumnInfo = useCallback(
    (width?: number) =>
      resolveColumnInfo({
        width,
        getColumnWidth,
        column,
      }),
    [column]
  );

  const [columnDimensions, setColumnDimensions] = useState(
    nextResolveColumnInfo()
  );

  const containerLayoutRef = useRef<ItemLayout>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const listRef = useRef<View>(null);
  const containerStyle = useMemo<ViewStyle>(() => {
    const style: ViewStyle = {
      position: 'relative',
      display: 'flex',
      /**
       * to make the backdrop div to render in column style
       */
      flexDirection: 'row',
    };

    return style;
  }, []);

  const onLayoutHandler = useCallback((e: LayoutChangeEvent) => {
    const scrollMetrics = contextValues.marshal
      ?.getScrollHelper()
      .getScrollMetrics();
    dimensionsModel.updateScrollMetrics(scrollMetrics);

    const rect = e.nativeEvent.layout;
    containerLayoutRef.current = rect;

    const { width } = e.nativeEvent.layout;
    if (!getColumnWidth) {
      setColumnDimensions(nextResolveColumnInfo(width));
    }
  }, []);

  const stateListener = useCallback(
    (stateResult: MasonryStateResults<ItemT>) => {
      setState(stateResult);
    },
    []
  );

  const dimensionsModel = useMemo(
    () =>
      new MasonryDimension<ItemT>({
        id: listId,
        data,
        column,
        ...rest,
        getContainerLayout:
          getContainerLayout || (() => containerLayoutRef.current),
        stateListener,
      }),
    []
  );

  const dataRef = useRef(data);

  if (dataRef.current !== data) {
    dimensionsModel.setData(data);
    dataRef.current = data;
  }

  const offsetRef = useRef(0);
  const tsRef = useRef(Date.now());

  useEffect(() => {
    const scrollMetrics = contextValues.marshal
      ?.getScrollHelper()
      .getScrollMetrics();
    if (scrollMetrics) {
      dimensionsModel.updateScrollMetrics({
        offset: scrollMetrics.offset || 0,
        visibleLength: scrollMetrics?.visibleLength || 750,
        contentLength: scrollMetrics.contentLength,
        velocity: 0,
      });
    }
    return contextValues.marshal
      ?.getScrollEventHelper()
      .subscribeEventHandler(
        'onScroll',
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const scrollMetrics = event.nativeEvent;
          const timestamp = Date.now();
          const offset = scrollMetrics.contentOffset.y;

          const dOffset = offset - offsetRef.current;
          const dt = timestamp - tsRef.current;
          const velocity = dOffset / dt;

          offsetRef.current = offset;
          tsRef.current = timestamp;

          dimensionsModel.updateScrollMetrics({
            offset,
            visibleLength: scrollMetrics.layoutMeasurement.height,
            contentLength: scrollMetrics.contentSize.height,
            velocity,
          });
        }
      );
  }, []);

  return (
    <View
      id={listId}
      onLayout={onLayoutHandler}
      style={containerStyle}
      ref={forwardRef || listRef}
    >
      {state?.map((columnState, index) => (
        <ColumnStateRenderer
          {...rest}
          key={index}
          state={columnState}
          columnIndex={index}
          dimensions={dimensionsModel}
          columnDimensions={columnDimensions}
        />
      ))}
    </View>
  );
};

export default ReactForwardRef(
  <ItemT extends GenericItemT>(
    props: MasonryListProps<ItemT>,
    ref?: ForwardedRef<View>
  ) => {
    return <MasonryList {...props} forwardRef={ref} />;
  }
);
