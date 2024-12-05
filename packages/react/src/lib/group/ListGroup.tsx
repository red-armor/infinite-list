import { GenericItemT, ListGroupDimensions } from '@infinite-list/data-model';
import React, {
  CSSProperties,
  FC,
  useCallback,
  // useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
// import { div, Platform } from 'react-native';

import { ListGroupProps, genericMemo } from './types';
import context from './context';
import PortalContent from './PortalContent';
import ScrollTracker from '../events/ScrollTracker';

// https://stackoverflow.com/a/70890101

const ClockStart = genericMemo(
  <ItemT extends GenericItemT>(props: {
    dimensions: ListGroupDimensions<ItemT>;
    inspectingTimes: number;
  }) => {
    props.dimensions.inspector.startCollection();
    return null;
  }
);
const ClockEnd = genericMemo(
  <ItemT extends GenericItemT>(props: {
    dimensions: ListGroupDimensions<ItemT>;
    inspectingTimes: number;
  }) => {
    props.dimensions.inspector.terminateCollection();
    return null;
  }
);

const ListGroup = <ItemT extends GenericItemT>(
  props: ListGroupProps<ItemT>
) => {
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
  // const { scrollEventHelper, getScrollHelper } = useContext(
  //   scrollComponentContext
  // );
  const layoutRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>();

  const listRef = useRef<HTMLDivElement>(null);
  const scrollHandlerRef = useRef<ScrollTracker>();

  useEffect(() => {
    const rect = listRef.current?.getBoundingClientRect();
    if (rect) {
      const { width, height, x, y } = rect;
      layoutRef.current = { x, y, width, height };
    }
  }, []);

  // const measureLayout = useCallback(
  //   (x: number, y: number, width: number, height: number) => {
  //     layoutRef.current = { x, y, width, height };
  //   },
  //   []
  // );

  // const scrollMetricsRef = useRef<any>();

  // const scrollHelper = getScrollHelper();

  // const { handler, layoutHandler } = scrollComponentUseMeasureLayout(viewRef, {
  //   onMeasureLayout: measureLayout,
  // });

  const getContainerLayout = useCallback(() => layoutRef.current!, []);
  const listGroupDimensions = useMemo(
    () =>
      new ListGroupDimensions<ItemT>({
        id,
        ...rest,
        viewabilityConfig,
        getContainerLayout,
        initialNumToRender,
        persistanceIndices,
        onViewableItemsChanged,
        viewabilityConfigCallbackPairs,
        canIUseRIC: true,
        // canIUseRIC: Platform.OS !== 'ios',
      }),
    []
  );

  const style: {
    [key: string]: CSSProperties;
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

  // useEffect(
  //   () =>
  //     scrollEventHelper.subscribeEventHandler('onContentSizeChange', () => {
  //       if (typeof handler === 'function') {
  //         handler();
  //       }
  //       const scrollMetrics = scrollHelper.getScrollMetrics();
  //       if (scrollMetrics !== scrollMetricsRef.current) {
  //         listGroupDimensions.updateScrollMetrics(
  //           scrollHelper.getScrollMetrics()
  //         );
  //         scrollMetricsRef.current = scrollMetrics;
  //       }
  //     }),
  //   []
  // );

  // useEffect(
  //   () =>
  //     scrollEventHelper.subscribeEventHandler('onScroll', () => {
  //       const scrollMetrics = scrollHelper.getScrollMetrics();
  //       if (scrollMetrics !== scrollMetricsRef.current) {
  //         listGroupDimensions.updateScrollMetrics(
  //           scrollHelper.getScrollMetrics()
  //         );
  //         scrollMetricsRef.current = scrollMetrics;
  //       }
  //     }),
  //   []
  // );

  useEffect(() => {
    const scrollTracker = new ScrollTracker({
      domNode: listRef.current!,
      onScroll: () => {
        listGroupDimensions.updateScrollMetrics(
          scrollHandlerRef.current?.getScrollMetrics()
        );
      },
    });
    scrollHandlerRef.current = scrollTracker;

    scrollTracker.addEventListeners();

    listGroupDimensions.updateScrollMetrics(scrollTracker.getScrollMetrics());

    return () => scrollTracker.dispose();
  }, []);

  // useEffect(
  //   () =>
  //     scrollEventHelper.subscribeEventHandler('onMomentumScrollEnd', () => {
  //       const scrollMetrics = scrollHelper.getScrollMetrics();
  //       if (scrollMetrics !== scrollMetricsRef.current) {
  //         listGroupDimensions.updateScrollMetrics(
  //           scrollHelper.getScrollMetrics()
  //         );
  //         scrollMetricsRef.current = scrollMetrics;
  //       }
  //     }),
  //   []
  // );

  // useEffect(() => {
  //   listGroupDimensions.updateScrollMetrics(scrollHelper.getScrollMetrics());
  // }, []);

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
    <div ref={listRef} style={style.container}>
      <ClockStart<ItemT>
        dimensions={listGroupDimensions}
        inspectingTimes={state.inspectingTimes}
      />
      <context.Provider value={state}>
        {children}
        <PortalContent<ItemT>
          id={id}
          listGroupDimensions={listGroupDimensions}
          scrollComponentUseMeasureLayout={scrollComponentUseMeasureLayout}
        />
      </context.Provider>
      <ClockEnd
        dimensions={listGroupDimensions}
        inspectingTimes={state.inspectingTimes}
      />
    </div>
  );
};

export default ListGroup;
