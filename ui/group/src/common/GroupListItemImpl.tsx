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
    recycleItemContainerKey,
    renderItem: RenderItem,
    teleportItemProps,
    ListItemWrapper,
    CellRendererComponent,
    ...rest
  } = props;

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
      recycleItemContainerKey={recycleItemContainerKey}
      ListItemWrapper={ListItemWrapper}
      CellRendererComponent={CellRendererComponent}
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
