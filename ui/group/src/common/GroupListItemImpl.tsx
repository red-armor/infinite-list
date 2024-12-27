import React from 'react';
import { GenericItemT } from '@infinite-list/strategies';

import ListItem from './ListItem';
import { GroupListItemImplProps } from '../types';

const GroupListItemImpl = <ItemT extends GenericItemT>(
  props: GroupListItemImplProps<ItemT>
) => {
  const {
    item,
    itemKey,
    dimensions,
    itemMeta,
    containerKey,
    renderItem: RenderItem,
    teleportItemProps,
    CellRendererComponent,
    ...rest
  } = props;

  // const getMetaOnViewableItemsChanged = useCallback(() => {
  //   return {
  //     item,
  //     index: itemMeta.getIndexInfo?.()?.index,
  //   };
  // }, [item]);

  const teleportProps =
    typeof teleportItemProps === 'function'
      ? teleportItemProps({
          item,
          index: itemMeta.getIndexInfo?.()?.index || -1,
        })
      : {};

  return (
    <ListItem<ItemT>
      item={item}
      itemKey={itemKey}
      itemMeta={itemMeta}
      dimensions={dimensions}
      containerKey={containerKey}
      CellRendererComponent={CellRendererComponent}
      // getMetaOnViewableItemsChanged={getMetaOnViewableItemsChanged}
    >
      {React.isValidElement(RenderItem) ? (
        RenderItem
      ) : RenderItem ? (
        <RenderItem
          item={item}
          {...teleportProps}
          {...rest}
          itemMeta={itemMeta}
        />
      ) : null}
    </ListItem>
  );
};

export default GroupListItemImpl;
