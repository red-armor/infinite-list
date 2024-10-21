import { useEffect, useMemo, useState, useRef, useContext } from 'react';
import {
  View,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { ListProps } from './types';
import { ListDimensions } from '@infinite-list/data-model';
import RecycleItem from './RecycleItem';
import SpaceItem from './SpaceItem';
import { ScrollViewContext } from '../scrollView';

const List = (props: ListProps) => {
  const { renderItem, id, data, containerRef } = props;
  const listModel = useMemo(() => new ListDimensions(props), []);
  const [state, setState] = useState(listModel.getStateResult());
  const contextValues = useContext(ScrollViewContext);

  console.log('context values ', contextValues);

  const dataRef = useRef(data);

  if (dataRef.current !== data) {
    dataRef.current = data;
    listModel.setData(dataRef.current);
  }

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

  useEffect(() => {
    listModel.addStateListener((newState) => {
      // @ts-ignore
      setState(newState);
    });
  }, []);

  const offsetRef = useRef(0);
  const tsRef = useRef(Date.now());

  useEffect(() => {
    // scrollHandlerRef.current = new ScrollTracker({
    //   domNode: listRef.current!,
    //   onScroll: () => {
    //     listModel.updateScrollMetrics(
    //       scrollHandlerRef.current?.getScrollMetrics()
    //     );
    //   },
    // });

    // scrollHandlerRef.current.addEventListeners();

    // @ts-ignore
    props.events.addEventListener(
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

        listModel.updateScrollMetrics({
          offset,
          visibleLength: scrollMetrics.layoutMeasurement.height,
          contentLength: scrollMetrics.contentSize.height,
          velocity,
        });
      }
    );

    // listModel.updateScrollMetrics({
    //   offset: 0,
    //   visibleLength: 900,
    //   contentLength: 0,
    // });

    // return () => scrollHandlerRef.current?.dispose();
  }, []);

  return (
    <View id={id} ref={listRef} style={style.container}>
      {state.recycleState.map((data) => (
        <RecycleItem
          key={data.key}
          data={data}
          containerRef={containerRef}
          renderItem={renderItem}
          dimensions={listModel}
        />
      ))}
      {state.spaceState.map((data) => (
        <SpaceItem
          key={data.key}
          data={data}
          containerRef={containerRef}
          renderItem={renderItem}
          dimensions={listModel}
        />
      ))}
    </View>
  );
};

export default List;
