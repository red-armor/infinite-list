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
import { ColumnDimensionInfo, MasonryListProps } from './types';
import ColumnStateRenderer from './ColumnStateRender';
import { ScrollViewContext } from '@infinite-list/scroller/react-native';

let count = 0;

const MasonryList = <ItemT extends GenericItemT>(
  props: MasonryListProps<ItemT>
) => {
  const [state, setState] = useState<MasonryStateResults<ItemT>>();
  const { id, data, column = 2, getColumnWidth, forwardRef, ...rest } = props;
  const contextValues = useContext(ScrollViewContext);

  const listId = useMemo(() => id || `__masonry_list${count++}__`, []);

  const resolveColumnInfo = useCallback((width?: number) => {
    const sequence = Array.from({ length: column }, (_, i) => i + 1);
    const nextWidth = width || 0;
    return sequence.reduce<ColumnDimensionInfo[]>((acc, cur, index) => {
      const current = {
        width: getColumnWidth?.(index) || nextWidth / column,
        left: 0,
        right: nextWidth - (getColumnWidth?.(index) || nextWidth / column),
      };
      if (!index) {
        acc.push(current);
        return acc;
      }
      const last = acc[acc.length - 1];
      if (last) {
        current.left = last.left + last.width;
        current.right = nextWidth - current.left - last.width;
      }
      acc.push(current);
      return acc;
    }, []);
  }, []);

  const [columnDimensions, setColumnDimensions] = useState(resolveColumnInfo());

  const listRef = useRef<View>(null);

  const style: {
    [key: string]: ViewStyle;
  } = useMemo(
    () => ({
      container: {
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
      },
    }),
    []
  );

  const onLayoutHandler = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (!getColumnWidth) {
      setColumnDimensions(resolveColumnInfo(width));
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
    const scrollMetrics = contextValues.getScrollHelper().getScrollMetrics();
    dimensionsModel.updateScrollMetrics({
      offset: scrollMetrics.offset || 0,
      visibleLength: scrollMetrics?.visibleLength || 750,
      contentLength: scrollMetrics.contentLength,
      velocity: 0,
    });

    return contextValues
      .getScrollHelper()
      .addListener(
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
      style={style.container}
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
