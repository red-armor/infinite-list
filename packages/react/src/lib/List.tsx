import { useEffect, useMemo, useState, useRef } from 'react';
import { ListProps } from './types';
import { ListDimensions } from '@infinite-list/data-model';
import RecycleItem from './RecycleItem';
import SpaceItem from './SpaceItem';
import ScrollTracker from './events/ScrollTracker';

const List = (props: ListProps) => {
  const { renderItem, id } = props;
  const listModel = useMemo(() => new ListDimensions(props), []);
  const [state, setState] = useState(listModel.getStateResult());
  const scrollHandlerRef = useRef<ScrollTracker>();

  const listRef = useRef<HTMLDivElement>(null);
  const style = useMemo(
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
    listModel.addStateListener((newState) => {
      setState(newState);
    });
  }, []);

  useEffect(() => {
    scrollHandlerRef.current = new ScrollTracker({
      domNode: listRef.current!,
      onScroll: () => {
        listModel.updateScrollMetrics(
          scrollHandlerRef.current?.getScrollMetrics()
        );
      },
    });

    scrollHandlerRef.current.addEventListeners();

    listModel.updateScrollMetrics(scrollHandlerRef.current.getScrollMetrics());

    return () => scrollHandlerRef.current?.dispose();
  }, []);

  return (
    <div id={id} ref={listRef} style={style.container}>
      {state.recycleState.map((data) => (
        <RecycleItem
          key={data.key}
          data={data}
          renderItem={renderItem}
          dimensions={listModel}
        />
      ))}
      {state.spaceState.map((data) => (
        <SpaceItem
          key={data.key}
          data={data}
          renderItem={renderItem}
          dimensions={listModel}
        />
      ))}
    </div>
  );
};

export { List };
