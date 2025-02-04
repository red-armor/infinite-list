import { ListGroupDimensions } from '@infinite-list/group-dimensions';
import { GenericItemT } from '@infinite-list/item-meta';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, Platform } from 'react-native';
import {
  RecycleContentItemWrapper,
  SpaceRendererComponent,
} from './CompatComponent';
import { ListGroupProps } from './types';
import { ListItemWrapper as TListItemWrapper } from '../types';
import context from '../common/context';
import PortalContent from '../common/PortalContent';
import { ClockStart, ClockEnd } from '../common/clock';
import { measureLayout } from './measure';
import CompatListItem from './CompatListItem';

const ListGroup = <ItemT extends GenericItemT>(
  props: ListGroupProps<ItemT>
) => {
  const {
    id,
    children,
    containerRef,
    onViewableItemsChanged,
    viewabilityConfig,
    viewabilityConfigCallbackPairs,
    initialNumToRender,
    persistenceIndices,
    scrollComponentContext,
    ...rest
  } = props;
  // @ts-ignore
  const { marshal } = useContext(scrollComponentContext);
  const layoutRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>();

  const viewRef = useRef<View>(null);
  const measureLayoutOnSuccessCallback = useCallback(
    (x: number, y: number, width: number, height: number) => {
      layoutRef.current = { x, y, width, height };
    },
    []
  );

  const scrollMetricsRef = useRef<any>();

  const scrollHelper = marshal.getScrollHelper();
  const scrollEventHelper = marshal.getScrollEventHelper();

  const layoutHandler = useCallback(() => {
    if (viewRef.current) {
      measureLayout(
        viewRef.current,
        containerRef.current,
        measureLayoutOnSuccessCallback
      );
    }
  }, []);

  useEffect(() => {
    if (viewRef.current) {
      measureLayout(
        viewRef.current,
        containerRef.current,
        measureLayoutOnSuccessCallback
      );
    }
  }, []);

  const getContainerLayout = useCallback(() => layoutRef.current!, []);
  const listGroupDimensions = useMemo(
    () =>
      new ListGroupDimensions<ItemT>({
        id,
        ...rest,
        viewabilityConfig,
        getContainerLayout,
        initialNumToRender,
        persistenceIndices,
        onViewableItemsChanged,
        viewabilityConfigCallbackPairs,
        canIUseRIC: Platform.OS !== 'ios',
      }),
    []
  );

  useEffect(
    () =>
      scrollEventHelper.subscribeEventHandler('onContentSizeChange', () => {
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

  /**
   * like IOC, the specific logic placed on the topmost.
   */
  const ListItemWrapper = useCallback<TListItemWrapper<ItemT>>((props) => {
    return <CompatListItem {...props} containerRef={viewRef} />;
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
          ListItemWrapper={ListItemWrapper}
          listGroupDimensions={listGroupDimensions}
          RecycleContentItemWrapper={RecycleContentItemWrapper}
          SpaceRendererComponent={SpaceRendererComponent}
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
