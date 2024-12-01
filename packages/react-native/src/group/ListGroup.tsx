import { ListGroupDimensions } from '@infinite-list/data-model';
import React, {
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, Platform } from 'react-native';

import { ListGroupProps } from '../types';
import context from './context';
import PortalContent from './PortalContent';

const ClockStart: FC<{
  dimensions: ListGroupDimensions;
  inspectingTimes: number;
}> = React.memo((props) => {
  props.dimensions.inspector.startCollection();
  return null;
});
const ClockEnd: FC<{
  dimensions: ListGroupDimensions;
  inspectingTimes: number;
}> = React.memo((props) => {
  props.dimensions.inspector.terminateCollection();
  return null;
});

const ListGroup: FC<ListGroupProps> = (props) => {
  const {
    children,
    id,
    onViewableItemsChanged,
    viewabilityConfig,
    viewabilityConfigCallbackPairs,
    initialNumToRender,
    persistanceIndices,
    scrollComponentContext,
    scrollComponentUseMeasureLayout,
    ...rest
  } = props;
  // @ts-ignore
  const { scrollEventHelper, getScrollHelper } = useContext(
    scrollComponentContext
  );
  const layoutRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>();

  const viewRef = useRef<View>(null);
  const measureLayout = useCallback(
    (x: number, y: number, width: number, height: number) => {
      layoutRef.current = { x, y, width, height };
    },
    []
  );

  const scrollMetricsRef = useRef<any>();

  const scrollHelper = getScrollHelper();

  const { handler, layoutHandler } = scrollComponentUseMeasureLayout(viewRef, {
    onMeasureLayout: measureLayout,
  });

  const getContainerLayout = useCallback(() => layoutRef.current!, []);
  const listGroupDimensions = useMemo(
    () =>
      new ListGroupDimensions({
        id,
        ...rest,
        viewabilityConfig,
        getContainerLayout,
        initialNumToRender,
        persistanceIndices,
        onViewableItemsChanged,
        viewabilityConfigCallbackPairs,
        canIUseRIC: Platform.OS !== 'ios',
      }),
    []
  );

  useEffect(
    () =>
      scrollEventHelper.subscribeEventHandler('onContentSizeChange', () => {
        if (typeof handler === 'function') {
          handler();
        }
        const scrollMetrics = scrollHelper.getScrollMetrics();
        if (scrollMetrics !== scrollMetricsRef.current) {
          listGroupDimensions.updateScrollMetrics(
            scrollHelper.getScrollMetrics()
          );
          scrollMetricsRef.current = scrollMetrics;
        }
      }),
    []
  );

  useEffect(
    () =>
      scrollEventHelper.subscribeEventHandler('onScroll', () => {
        const scrollMetrics = scrollHelper.getScrollMetrics();
        if (scrollMetrics !== scrollMetricsRef.current) {
          listGroupDimensions.updateScrollMetrics(
            scrollHelper.getScrollMetrics()
          );
          scrollMetricsRef.current = scrollMetrics;
        }
      }),
    []
  );

  useEffect(
    () =>
      scrollEventHelper.subscribeEventHandler('onMomentumScrollEnd', () => {
        const scrollMetrics = scrollHelper.getScrollMetrics();
        if (scrollMetrics !== scrollMetricsRef.current) {
          listGroupDimensions.updateScrollMetrics(
            scrollHelper.getScrollMetrics()
          );
          scrollMetricsRef.current = scrollMetrics;
        }
      }),
    []
  );

  useEffect(() => {
    listGroupDimensions.updateScrollMetrics(scrollHelper.getScrollMetrics());
  }, []);

  const [state, setState] = useState(() => ({
    ...listGroupDimensions.inspector.getAPI(),
    listGroupDimensions,
  }));

  useEffect(() => {
    return listGroupDimensions.inspector.addStartInspectingHandler((props) => {
      setState((state) => ({
        ...state,
        ...props,
      }));
    });
  }, []);

  return (
    <View onLayout={layoutHandler} ref={viewRef}>
      <ClockStart
        dimensions={listGroupDimensions}
        inspectingTimes={state.inspectingTimes}
      />
      <context.Provider value={state}>
        {children}
        <PortalContent
          id={id}
          listGroupDimensions={listGroupDimensions}
          scrollComponentUseMeasureLayout={scrollComponentUseMeasureLayout}
        />
      </context.Provider>
      <ClockEnd
        dimensions={listGroupDimensions}
        inspectingTimes={state.inspectingTimes}
      />
    </View>
  );
};

export default ListGroup;
