import { defaultKeyExtractor } from '@infinite-list/data-model';
import { useContext, useEffect, useRef } from 'react';
import context from '../context';

export default (props) => {
  const disposerRef = useRef<Function>();
  const initialRef = useRef(true);

  const { listGroupDimensions } = useContext(context);
  const {
    data,
    keyExtractor = defaultKeyExtractor,
    id,
    renderItem,
    onEndReached,
    recyclerType,
    teleportItemProps,
    ...rest
  } = props;

  const dataRef = useRef(data);

  useEffect(() => {
    listGroupDimensions!.setOnEndReached(id, onEndReached);
  }, [onEndReached]);

  if (initialRef.current) {
    disposerRef.current = listGroupDimensions!.registerList(id, {
      data,
      keyExtractor,
      onEndReached,
      recycleEnabled: true,
      recyclerType,
      ...rest,
    }).remover;
    // @ts-ignore
    listGroupDimensions!.getDimension(id).renderItem = renderItem;
    // @ts-ignore
    listGroupDimensions!.getDimension(id).teleportItemProps = teleportItemProps;
    initialRef.current = false;
  }

  if (dataRef.current !== data) {
    listGroupDimensions!.setListData(id, data);
    dataRef.current = data;
  }

  useEffect(
    () => () => {
      if (typeof disposerRef.current === 'function') disposerRef.current();
    },
    []
  );
};
