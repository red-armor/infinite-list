import { defaultKeyExtractor } from '@infinite-list/utils';
import { useContext, useEffect, useRef } from 'react';
import context, { ContextType } from '../context';
import { DefaultItemT, GroupListProps } from '../../types';
import { ListDimensionsModel } from '@infinite-list/dimensions-model';

export default <ItemT extends DefaultItemT>(props: GroupListProps<ItemT>) => {
  const disposerRef = useRef<Function>();
  const initialRef = useRef(true);

  const { listGroupDimensions } = useContext<ContextType<ItemT>>(context);
  const {
    data,
    keyExtractor = defaultKeyExtractor<ItemT>,
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

    (
      listGroupDimensions!.getDimension(id) as ListDimensionsModel<
        ItemT,
        {
          renderItem: any;
          teleportItemProps: any;
        }
      >
    ).extraInfo.renderItem = renderItem;
    (
      listGroupDimensions!.getDimension(id) as ListDimensionsModel<
        ItemT,
        {
          renderItem: any;
          teleportItemProps: any;
        }
      >
    ).extraInfo.teleportItemProps = teleportItemProps;
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
