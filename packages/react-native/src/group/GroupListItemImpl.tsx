import React, { useCallback } from 'react';

import ListItem from '../ListItem';
import { GroupListItemImplProps, DefaultItemT } from '../types';

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
      ? teleportItemProps({ item, index: itemMeta.getIndexInfo?.()?.index })
      : {};

  return (
    <ListItem
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
          itemMeta={itemMeta}
        />
      ) : null}
    </ListItem>
  );
};

export default GroupListItemImpl;
