import { ListGroupDimensions } from '@infinite-list/group-dimensions';
import { GenericItemT } from '@infinite-list/item-meta';
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  RefObject,
} from 'react';

import { ListGroupProps } from './types';
import context from '../common/context';
import PortalContent from '../common/PortalContent';
import { ScrollTracker } from '@infinite-list/scroller/web';
import { ClockStart, ClockEnd } from '../common/clock';
import {
  RecycleContentItemWrapper,
  SpaceRendererComponent,
} from './CompatComponent';
import CompatListItem from './CompatListItem';

const ListGroup = <ItemT extends GenericItemT>(
  props: ListGroupProps<ItemT>
) => {
  const {
    id,
    children,
    horizontal,
    scrollerRef,
    onViewableItemsChanged,
    viewabilityConfig,
    viewabilityConfigCallbackPairs,
    initialNumToRender,
    persistenceIndices,
    scrollComponentContext,
    ...rest
  } = props;

  /**
   * passing with scrollerRef, use external scroller
   */
  const usingControlledScroller = useMemo(() => {
    return !!scrollerRef;
  }, [scrollerRef]);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerDomRef = useMemo<RefObject<HTMLDivElement>>(() => {
    if (scrollerRef) return scrollerRef;
    return containerRef as RefObject<HTMLDivElement>;
  }, []);
  const containerLayoutRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // const listRef = useRef<HTMLDivElement>(null);
  const scrollHandlerRef = useRef<ScrollTracker>();

  useEffect(() => {
    if (containerRef.current && usingControlledScroller) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        /**
         * relative position offset to parent.. getBoundingClientRect is not correct.
         * https://stackoverflow.com/questions/11634770/get-position-offset-of-element-relative-to-a-parent-container
         * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetTop
         */
        containerLayoutRef.current = {
          x: containerRef.current.offsetLeft,
          y: containerRef.current.offsetTop,
          width: rect.width,
          height: rect.height,
        };
        // containerLayoutRef.current.x = rect.x;
        // containerLayoutRef.current.y = rect.y;
        // containerLayoutRef.current.width = rect.width;
        // containerLayoutRef.current.height = rect.height;
      }
    }
  }, []);

  const getContainerLayout = useCallback(() => containerLayoutRef.current!, []);
  const listGroupDimensions = useMemo(
    () =>
      new ListGroupDimensions<ItemT>({
        id,
        horizontal,
        ...rest,
        viewabilityConfig,
        getContainerLayout,
        initialNumToRender,
        persistenceIndices,
        onViewableItemsChanged,
        viewabilityConfigCallbackPairs,
        canIUseRIC: true,
      }),
    []
  );

  const containerStyle = useMemo<CSSProperties>(() => {
    const style: CSSProperties = { position: 'relative' };
    if (horizontal) {
      style.display = 'flex';
      style.flexDirection = 'column';
      style.height = '100%';
    }

    if (!usingControlledScroller) {
      style.width = '100%';
      style.height = '100%';
      if (horizontal) {
        style.overflowX = 'auto';
      } else {
        style.overflowY = 'auto';
      }
    }

    return style;
  }, [usingControlledScroller]);

  // const style: {
  //   [key: string]: CSSProperties;
  // } = useMemo(
  //   () => ({
  //     container: {
  //       width: '100%',
  //       height: '100%',
  //       overflowY: 'auto',
  //       position: 'relative',
  //     },
  //   }),
  //   []
  // );

  useEffect(() => {
    const scrollTracker = new ScrollTracker({
      domNode: scrollerDomRef.current!,
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
    <div ref={containerRef} style={containerStyle}>
      <ClockStart<ItemT>
        dimensions={listGroupDimensions}
        inspectingTimes={state.inspectingTimes}
      />
      <context.Provider value={state}>
        {children}
        <PortalContent<ItemT>
          id={id}
          ListItemWrapper={CompatListItem}
          listGroupDimensions={listGroupDimensions}
          RecycleContentItemWrapper={RecycleContentItemWrapper}
          SpaceRendererComponent={SpaceRendererComponent}
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
