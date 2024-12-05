import React, { useCallback } from 'react';

import ListItem from './ListItem';
import { DefaultItemT } from '../types';
import { GroupListItemImplProps } from './types';

const GroupListItemImpl = <ItemT extends DefaultItemT>(
  props: GroupListItemImplProps<ItemT>
) => {
  const {
    item,
    listKey,
    dimensions,
    itemMeta,
    containerKey,
    renderItem: RenderItem,
    teleportItemProps,
    CellRendererComponent,
    scrollComponentUseMeasureLayout,
    ...rest
  } = props;

  const getMetaOnViewableItemsChanged = useCallback(() => {
    return {
      item,
      index: itemMeta.getIndexInfo?.()?.index,
    };
  }, [item]);

  const teleportProps =
    typeof teleportItemProps === 'function'
      ? // @ts-ignore
        teleportItemProps({ item, index: itemMeta.getIndexInfo?.()?.index })
      : {};

  return (
    <ListItem<ItemT>
      item={item}
      listKey={listKey}
      itemMeta={itemMeta}
      dimensions={dimensions}
      containerKey={containerKey}
      CellRendererComponent={CellRendererComponent}
      getMetaOnViewableItemsChanged={getMetaOnViewableItemsChanged}
      scrollComponentUseMeasureLayout={scrollComponentUseMeasureLayout}
    >
      {React.isValidElement(RenderItem) ? (
        RenderItem
      ) : RenderItem ? (
        <RenderItem
          item={item}
          {...teleportProps}
          {...rest}
          // @ts-ignore
          itemMeta={itemMeta}
        />
      ) : null}
    </ListItem>
  );
};

export default GroupListItemImpl;
