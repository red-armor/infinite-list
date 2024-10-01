import { useEffect, useMemo, useState, useRef } from 'react';
import { ListProps } from './types';
import { ListDimensions } from '@infinite-list/data-model';
import Item from './Item';

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

  console.log('stae =', state);

  return (
    <div ref={listRef} style={style.container}>
      {state.recycleState.map((data) => (
        <Item
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
