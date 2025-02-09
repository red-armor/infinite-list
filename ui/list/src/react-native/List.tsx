import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useContext,
  useCallback,
} from 'react';
import { View, ViewStyle, LayoutChangeEvent } from 'react-native';
import { ItemLayout } from '@infinite-list/types';
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
    scrollerRef,
    horizontal = false,
    recycleEnabled = true,
    getContainerLayout,
  } = props;
  const listModel = useMemo(
    () =>
      new ListDimensions({
        ...props,
        getContainerLayout:
          getContainerLayout || (() => containerLayoutRef.current),
      }),
    []
  );
  const [state, setState] = useState(listModel.getStateResult());
  const contextValues = useContext(ScrollViewContext);

  const dataRef = useRef(data);

  if (dataRef.current !== data) {
    dataRef.current = data;
    listModel.setData(dataRef.current);
  }
  const containerLayoutRef = useRef<ItemLayout>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
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

  /**
   * Trigger list render after initialization or content will be blank
   */
  const onLayoutHandler = useCallback((e: LayoutChangeEvent) => {
    const scrollMetrics = contextValues.marshal
      ?.getScrollHelper()
      .getScrollMetrics();
    listModel.updateScrollMetrics(scrollMetrics);

    const rect = e.nativeEvent.layout;
    containerLayoutRef.current = rect;

    listRef.current?.measureLayout(
      contextValues.marshal?.getScrollHelper().getRef().current,
      (x, y, width, height) => {
        console.log('x -----------', x, y, width, height);

        containerLayoutRef.current = {
          x,
          y,
          width,
          height,
        };
      }
    );

    console.log('rect ----------', rect);
  }, []);

  useEffect(
    () =>
      contextValues.marshal?.getScrollHelper().addListener('onScroll', () => {
        const scrollMetrics = contextValues.marshal
          ?.getScrollHelper()
          .getScrollMetrics();
        listModel.updateScrollMetrics(scrollMetrics);
      }),
    []
  );

  console.log('state ----- ', state);

  if (recycleEnabled) {
    const nextState = state as RecycleStateResult<ItemT>;
    return (
      <View
        id={id}
        ref={listRef}
        style={containerStyle}
        onLayout={onLayoutHandler}
      >
        {nextState.recycleState.map((data) => (
          <RecycleItem
            key={data.key}
            data={data}
            scrollerRef={scrollerRef}
            renderItem={renderItem}
            dimensions={listModel}
            horizontal={!!horizontal}
          />
        ))}
        {nextState.spaceState.map((data) => (
          <SpaceItem
            key={data.key}
            data={data}
            scrollerRef={scrollerRef}
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
