import {
  useEffect,
  useMemo,
  useState,
  useRef,
  CSSProperties,
  RefObject,
} from 'react';
import { ListDimensions } from '@infinite-list/list-dimensions';
import { RecycleStateResult } from '@infinite-list/strategies';
import { GenericItemT } from '@infinite-list/item-meta';
import { ListProps } from './types';
import RecycleItem from './RecycleItem';
import SpaceItem from './SpaceItem';
import { ScrollTracker } from '@infinite-list/scroller/web';
import { ItemLayout } from '@infinite-list/types';

export const List = <ItemT extends GenericItemT>(props: ListProps<ItemT>) => {
  const {
    renderItem,
    id,
    data,
    recycleEnabled = true,
    horizontal,
    scrollerRef,
    getContainerLayout,
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
  const containerLayoutRef = useRef<ItemLayout>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const listModel = useMemo(
    () =>
      new ListDimensions<ItemT>({
        ...props,
        getContainerLayout:
          getContainerLayout || (() => containerLayoutRef.current),
      }),
    []
  );

  const [state, setState] = useState(listModel.getStateResult());
  const scrollHandlerRef = useRef<ScrollTracker>();

  const dataRef = useRef(data);

  useEffect(() => {
    /**
     * only with controlled scroller should consider container offset value.
     * The uncontrolled scroller condition the offset value always be 0.
     */
    if (containerRef.current && usingControlledScroller) {
      const rect = containerRef.current.getBoundingClientRect();
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
    }
  }, []);

  if (dataRef.current !== data) {
    dataRef.current = data;
    listModel.setData(dataRef.current);
  }

  const containerStyle = useMemo<CSSProperties>(() => {
    const style: CSSProperties = { position: 'relative' };
    if (horizontal) {
      style.display = 'flex';
      style.height = '100%';
    }

    if (!usingControlledScroller) {
      style.width = '100%';
      style.height = '100%';
      if (horizontal) {
        style.flexDirection = 'column';
        style.overflowX = 'auto';
      } else {
        style.overflowY = 'auto';
      }
    } else if (horizontal) {
      // https://stackoverflow.com/a/9277377
      style.display = 'inline-block';
    }

    return style;
  }, [usingControlledScroller]);

  useEffect(
    () =>
      listModel.addStateListener((newState) => {
        setState(newState);
      }),
    []
  );

  useEffect(() => {
    const scrollTracker = new ScrollTracker({
      domNode: scrollerDomRef,
      horizontal,
      onScroll: () => {
        listModel.updateScrollMetrics(
          scrollHandlerRef.current?.getScrollMetrics()
        );
      },
    });
    scrollHandlerRef.current = scrollTracker;

    scrollTracker.addEventListeners();

    listModel.updateScrollMetrics(scrollTracker.getScrollMetrics());

    return () => scrollTracker.dispose();
  }, []);

  if (recycleEnabled) {
    return (
      <div id={id} ref={containerRef} style={containerStyle}>
        {(state as RecycleStateResult<ItemT>).spaceState.map((data) => (
          <SpaceItem
            key={data.key}
            data={data}
            horizontal={!!horizontal}
            renderItem={renderItem}
            dimensions={listModel}
          />
        ))}
        {(state as RecycleStateResult<ItemT>).recycleState.map((data) => (
          <RecycleItem
            key={data.key}
            data={data}
            horizontal={!!horizontal}
            renderItem={renderItem}
            dimensions={listModel}
          />
        ))}
      </div>
    );
  }
  return null;
  // TODO: implement static list
};

export default List;
