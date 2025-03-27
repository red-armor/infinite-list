import { defaultKeyExtractor } from '@infinite-list/data-model';
import { useContext, useEffect, useRef } from 'react';

import context from '../context';
import type { DefaultItemT, GroupListProps } from '../types';

export default <ItemT extends DefaultItemT>(props: GroupListProps<ItemT>) => {
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
    if (onEndReached) listGroupDimensions!.setOnEndReached(id, onEndReached);
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
    listGroupDimensions!.getDimension(id).renderItem = renderItem;
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
