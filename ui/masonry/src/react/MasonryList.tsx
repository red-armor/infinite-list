import {
  useCallback,
  useState,
  useRef,
  useMemo,
  useEffect,
  forwardRef as ReactForwardRef,
  ForwardedRef,
  CSSProperties,
  RefObject,
} from 'react';
import {
  GenericItemT,
  MasonryDimensions as MasonryDimension,
  MasonryStateResults,
} from '@infinite-list/masonry-dimensions';
import { MasonryListProps } from './types';
import ColumnStateRenderer from './ColumnStateRender';
import { ScrollTracker } from '@infinite-list/scroller/web';
import { resolveColumnInfo } from '../common/utils';
import { ItemLayout } from '@infinite-list/types';

let count = 0;

export const MasonryList = <ItemT extends GenericItemT>(
  props: MasonryListProps<ItemT>
) => {
  const [state, setState] = useState<MasonryStateResults<ItemT>>();
  const {
    id,
    data,
    column = 2,
    getColumnWidth,
    scrollerRef,
    forwardRef,
    horizontal,
    getContainerLayout,
    ...rest
  } = props;

  const scrollHandlerRef = useRef<ScrollTracker>();

  const listId = useMemo(() => id || `__masonry_list${count++}__`, []);

  const nextResolveColumnInfo = useCallback(
    (width?: number) =>
      resolveColumnInfo({
        width,
        getColumnWidth,
        column,
      }),
    [column]
  );

  const [columnDimensions, setColumnDimensions] = useState(
    nextResolveColumnInfo()
  );

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

  useEffect(() => {
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

    if (!getColumnWidth) {
      const boundingRect = containerRef.current?.getBoundingClientRect();
      if (boundingRect) {
        const { width } = boundingRect;
        setColumnDimensions(nextResolveColumnInfo(width));
      }
    }
  }, []);

  const stateListener = useCallback(
    (stateResult: MasonryStateResults<ItemT>) => {
      setState(stateResult);
    },
    []
  );

  useEffect(() => {
    scrollHandlerRef.current = new ScrollTracker({
      domNode: scrollerDomRef,
      onScroll: () => {
        dimensionsModel.updateScrollMetrics(
          scrollHandlerRef.current?.getScrollMetrics()
        );
      },
    });

    scrollHandlerRef.current.addEventListeners();
    dimensionsModel.updateScrollMetrics(
      scrollHandlerRef.current.getScrollMetrics()
    );

    return () => scrollHandlerRef.current?.dispose();
  }, []);

  const dimensionsModel = useMemo(
    () =>
      new MasonryDimension<ItemT>({
        id: listId,
        data,
        column,
        ...rest,
        getContainerLayout:
          getContainerLayout || (() => containerLayoutRef.current),
        stateListener,
      }),
    []
  );

  const dataRef = useRef(data);

  if (dataRef.current !== data) {
    dimensionsModel.setData(data);
    dataRef.current = data;
  }

  return (
    <div
      id={listId}
      style={containerStyle}
      ref={forwardRef || containerRef}
      className="masonry-list-container"
    >
      {state?.map((columnState, index) => (
        <ColumnStateRenderer
          {...rest}
          key={index}
          horizontal={horizontal}
          state={columnState}
          columnIndex={index}
          dimensions={dimensionsModel}
          columnDimensions={columnDimensions}
        />
      ))}
    </div>
  );
};

export default ReactForwardRef(
  <ItemT extends GenericItemT>(
    props: MasonryListProps<ItemT>,
    ref?: ForwardedRef<HTMLDivElement>
  ) => {
    return <MasonryList {...props} forwardRef={ref} />;
  }
);
