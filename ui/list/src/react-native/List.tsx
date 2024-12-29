import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useContext,
  useCallback,
} from 'react';
import {
  View,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { ListProps } from './types';
import { ListDimensions } from '@infinite-list/list-dimensions';
import { RecycleStateResult } from '@infinite-list/strategies';
import { GenericItemT } from '@infinite-list/item-meta';
import RecycleItem from './RecycleItem';
import SpaceItem from './SpaceItem';
import { ScrollViewContext } from '@infinite-list/scroller/react-native';

const List = <ItemT extends GenericItemT>(props: ListProps<ItemT>) => {
  const {
    renderItem,
    id,
    data,
    containerRef,
    recycleEnabled = true,
    horizontal,
  } = props;
  const listModel = useMemo(() => new ListDimensions(props), []);
  const [state, setState] = useState(listModel.getStateResult());
  const contextValues = useContext(ScrollViewContext);

  const dataRef = useRef(data);

  if (dataRef.current !== data) {
    dataRef.current = data;
    listModel.setData(dataRef.current);
  }

  const listRef = useRef<View>(null);
  const containerStyle = useMemo<ViewStyle>(() => {
    const style = {
      // width: '100%',
      // height: '100%',
      // overflowY: 'auto',
      // position: 'relative',
    } as ViewStyle;
    if (horizontal)
      return {
        ...style,
        display: 'flex',
        height: '100%',
        flexDirection: 'row',
        backgroundColor: 'blue',
        position: 'relative',
      };
    return style;
  }, []);

  useEffect(() => {
    listModel.addStateListener((newState) => {
      // @ts-ignore
      setState(newState);
    });
  }, []);

  const offsetRef = useRef(0);
  const tsRef = useRef(Date.now());

  /**
   * Trigger list render after initialization or content will be blank
   */
  const onLayoutHandler = useCallback(() => {
    const scrollMetrics = contextValues
      .getScrollHelper()
      .getScrollEventMetrics();
    const timestamp = Date.now();
    const offset = listModel
      .getSelectValue()
      .selectOffset(scrollMetrics.contentOffset);

    const dOffset = offset - offsetRef.current;
    const dt = timestamp - tsRef.current;
    const velocity = dOffset / dt;

    offsetRef.current = offset;
    tsRef.current = timestamp;

    listModel.updateScrollMetrics({
      offset,
      visibleLength: scrollMetrics.layoutMeasurement.height,
      contentLength: scrollMetrics.contentSize.height,
      velocity,
    });
  }, []);

  useEffect(
    () =>
      contextValues
        .getScrollHelper()
        .addListener(
          'onScroll',
          (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const scrollMetrics = event.nativeEvent;
            const timestamp = Date.now();
            const offset = listModel
              .getSelectValue()
              .selectOffset(scrollMetrics.contentOffset);

            const dOffset = offset - offsetRef.current;
            const dt = timestamp - tsRef.current;
            const velocity = dOffset / dt;

            offsetRef.current = offset;
            tsRef.current = timestamp;

            listModel.updateScrollMetrics({
              offset,
              visibleLength: scrollMetrics.layoutMeasurement.height,
              contentLength: scrollMetrics.contentSize.height,
              velocity,
            });
          }
        ),
    []
  );

  if (recycleEnabled) {
    const nextState = state as RecycleStateResult<ItemT>;

    // return (
    //   <>
    //     {nextState.recycleState.map((data) => (
    //       <RecycleItem
    //         key={data.key}
    //         data={data}
    //         containerRef={containerRef}
    //         renderItem={renderItem}
    //         dimensions={listModel}
    //         horizontal={!!horizontal}
    //       />
    //     ))}
    //     {nextState.spaceState.map((data) => (
    //       <SpaceItem
    //         key={data.key}
    //         data={data}
    //         containerRef={containerRef}
    //         renderItem={renderItem}
    //         dimensions={listModel}
    //         horizontal={!!horizontal}
    //       />
    //     ))}
    //   </>
    // );

    // console.log('data ref ',dataRef.current)

    // console.log('spaceState ', nextState)

    return (
      <View
        id={id}
        ref={listRef}
        style={containerStyle}
        onLayout={onLayoutHandler}
      >
        {/* <View style={{ width: 50, height: 30, backgroundColor: 'pink'}}>33</View>
        <View style={{ width: 50, height: 30, backgroundColor: 'pink'}}>33</View>
        <View style={{ width: 50, height: 30, backgroundColor: 'pink'}}>33</View> */}
        {nextState.recycleState.map((data) => (
          <RecycleItem
            key={data.key}
            data={data}
            containerRef={listRef}
            renderItem={renderItem}
            dimensions={listModel}
            horizontal={!!horizontal}
          />
        ))}
        {nextState.spaceState.map((data) => (
          <SpaceItem
            key={data.key}
            data={data}
            containerRef={listRef}
            renderItem={renderItem}
            dimensions={listModel}
            horizontal={!!horizontal}
          />
        ))}
      </View>
    );
  }

  return <View />;
};

export default List;
