import { useEffect, useMemo, useState, useRef, CSSProperties } from 'react';
import { ListProps } from '../types';
import {
  GenericItemT,
  ListDimensions,
  RecycleStateResult,
} from '@infinite-list/data-model';
import RecycleItem from './RecycleItem';
import SpaceItem from './SpaceItem';
import ScrollTracker from '../events/ScrollTracker';

export const List = <ItemT extends GenericItemT>(props: ListProps<ItemT>) => {
  const { renderItem, id, data, recycleEnabled = true } = props;
  const listModel = useMemo(() => new ListDimensions<ItemT>(props), []);
  const [state, setState] = useState(listModel.getStateResult());
  const scrollHandlerRef = useRef<ScrollTracker>();

  const dataRef = useRef(data);

  if (dataRef.current !== data) {
    dataRef.current = data;
    listModel.setData(dataRef.current);
  }

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

  useEffect(
    () =>
      listModel.addStateListener((newState) => {
        setState(newState);
      }),
    []
  );

  useEffect(() => {
    const scrollTracker = new ScrollTracker({
      domNode: listRef.current!,
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
      <>
        <div id={id} ref={listRef} style={style.container}>
          {(state as RecycleStateResult<ItemT>).spaceState.map((data) => (
            <SpaceItem
              key={data.key}
              data={data}
              renderItem={renderItem}
              dimensions={listModel}
            />
          ))}
          {(state as RecycleStateResult<ItemT>).recycleState.map((data) => (
            <RecycleItem
              key={data.key}
              data={data}
              renderItem={renderItem}
              dimensions={listModel}
            />
          ))}
        </div>
      </>
    );
  }
  // TODO: implement static list
};

export default List;
