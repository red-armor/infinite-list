import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, View } from 'react-native';
import ScrollViewContext from 'ui/scroller/src/react-native/context/ScrollViewContext';
import { ListGroupDimensions } from '@infinite-list/group-dimensions';
import type { GenericItemT } from '@infinite-list/item-meta';
import PortalContent from '../common/PortalContent';
import { ClockEnd, ClockStart } from '../common/clock';
import context from '../common/context';
import type { ListItemWrapper as TListItemWrapper } from '../types';
import {
  RecycleContentItemWrapper,
  SpaceRendererComponent,
} from './CompatComponent';
import CompatListItem from './CompatListItem';
import { measureLayout } from './measure';
import type { ListGroupProps } from './types';

const ListGroup = <ItemT extends GenericItemT>(
  props: ListGroupProps<ItemT>
) => {
  const {
    id,
    children,

    onViewableItemsChanged,
    viewabilityConfig,
    viewabilityConfigCallbackPairs,
    initialNumToRender,
    persistenceIndices,
    scrollComponentContext,
    ...rest
  } = props;
  const contextValues = useContext(ScrollViewContext);
  const containerRef = props.containerRef ?? contextValues.scrollerRef;
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

  // TODO containerRef may has error...
  // should use root scroller ref
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
      scrollHelper.addScrollMetricsChangeListener(() => {
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
