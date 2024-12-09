import {
  useCallback,
  useState,
  useRef,
  useMemo,
  useEffect,
  forwardRef as ReactForwardRef,
  ForwardedRef,
  CSSProperties,
} from 'react';
import {
  GenericItemT,
  MasonryDimension,
  MasonryStateResults,
} from '@infinite-list/data-model';
import { ColumnDimensionInfo, MasonryListProps } from './types';
import ColumnStateRenderer from './ColumnStateRender';
import { ScrollTracker } from '@infinite-list/scroller/web';

let count = 0;

export const MasonryList = <ItemT extends GenericItemT>(
  props: MasonryListProps<ItemT>
) => {
  const [state, setState] = useState<MasonryStateResults<ItemT>>();
  const { id, data, column = 2, getColumnWidth, forwardRef, ...rest } = props;

  const scrollHandlerRef = useRef<ScrollTracker>();

  const listId = useMemo(() => id || `__masonry_list${count++}__`, []);

  const resolveColumnInfo = useCallback((width?: number) => {
    const sequence = Array.from({ length: column }, (_, i) => i + 1);
    const nextWidth = width || 0;
    return sequence.reduce<ColumnDimensionInfo[]>((acc, cur, index) => {
      const current = {
        width: getColumnWidth?.(index) || nextWidth / column,
        left: 0,
        right: nextWidth - (getColumnWidth?.(index) || nextWidth / column),
      };
      if (!index) {
        acc.push(current);
        return acc;
      }
      const last = acc[acc.length - 1];
      if (last) {
        current.left = last.left + last.width;
        current.right = nextWidth - current.left - last.width;
      }
      acc.push(current);
      return acc;
    }, []);
  }, []);

  const [columnDimensions, setColumnDimensions] = useState(resolveColumnInfo());

  const listRef = useRef<HTMLDivElement>(null);

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
    if (!getColumnWidth) {
      const boundingRect = listRef.current?.getBoundingClientRect();
      if (boundingRect) {
        const { width } = boundingRect;
        setColumnDimensions(resolveColumnInfo(width));
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
      domNode: listRef.current!,
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
      style={style.container}
      ref={forwardRef || listRef}
      className="masonry-list-container"
    >
      {state?.map((columnState, index) => (
        <ColumnStateRenderer
          {...rest}
          key={index}
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
