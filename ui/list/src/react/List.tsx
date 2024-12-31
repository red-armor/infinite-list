import { useEffect, useMemo, useState, useRef, CSSProperties } from 'react';
import { ListDimensions } from '@infinite-list/list-dimensions';
import { RecycleStateResult } from '@infinite-list/strategies';
import { GenericItemT } from '@infinite-list/item-meta';
import { ListProps } from '../types';
import RecycleItem from './RecycleItem';
import SpaceItem from './SpaceItem';
import { ScrollTracker } from '@infinite-list/scroller/web';

export const List = <ItemT extends GenericItemT>(props: ListProps<ItemT>) => {
  const { renderItem, id, data, recycleEnabled = true, horizontal } = props;
  const listModel = useMemo(
    () =>
      new ListDimensions<ItemT>({
        ...props,
        // getContainerLayout: () => ({
        //   x: 0,
        //   y: 300,
        //   width: 600,
        //   height: 300,
        // }),
      }),
    []
  );

  const [state, setState] = useState(listModel.getStateResult());
  const scrollHandlerRef = useRef<ScrollTracker>();

  const dataRef = useRef(data);

  if (dataRef.current !== data) {
    dataRef.current = data;
    listModel.setData(dataRef.current);
  }

  const listRef = useRef<HTMLDivElement>(null);
  const containerStyle = useMemo<CSSProperties>(() => {
    const style = {
      // width: '100%',
      // height: '100%',
      position: 'relative',
    } as CSSProperties;
    if (horizontal)
      return {
        ...style,
        display: 'flex',
        flexDirection: 'column',
      };
    return style;
  }, []);

  useEffect(
    () =>
      listModel.addStateListener((newState) => {
        setState(newState);
      }),
    []
  );

  useEffect(() => {
    const scrollTracker = new ScrollTracker({
      // domNode: listRef.current!,
      domNode: props.containerRef.current,
      horizontal: horizontal,
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

  console.log('state -----------', state);

  if (recycleEnabled) {
    return (
      <div id={id} ref={listRef} style={containerStyle}>
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
