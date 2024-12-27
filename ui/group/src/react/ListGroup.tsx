import { ListGroupDimensions } from '@infinite-list/group-dimensions';
import { GenericItemT } from '@infinite-list/item-meta';
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ListGroupProps, genericMemo } from '../types';
import context from '../common/context';
import PortalContent from './PortalContent';
import { ScrollTracker } from '@infinite-list/scroller/web';

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
