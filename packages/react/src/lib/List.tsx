import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  UIEventHandler,
} from 'react';
import { ListProps } from './types';
import { ListDimensions } from '@infinite-list/data-model';
import RecycleItem from './RecycleItem';
import SpaceItem from './SpaceItem';

const List = (props: ListProps) => {
  const { renderItem } = props;
  const listModel = useMemo(() => new ListDimensions(props), []);
  const [state, setState] = useState(listModel.getStateResult());

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
    const rect = listRef.current?.getBoundingClientRect();
    if (rect) {
      const { height } = rect;
      listModel.updateScrollMetrics({
        offset: 0,
        visibleLength: height,
        contentLength: 0,
      });
    }
  }, []);

  const onScrollHandler: UIEventHandler<HTMLDivElement> = useCallback(() => {
    if (listRef.current) {
      listModel.updateScrollMetrics({
        offset: listRef.current?.scrollTop,
        visibleLength: listRef.current?.clientHeight,
        contentLength: listRef.current?.scrollHeight,
      });
    }
  }, []);

  console.log('state ==== ', state);

  return (
    <div ref={listRef} style={style.container} onScroll={onScrollHandler}>
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
