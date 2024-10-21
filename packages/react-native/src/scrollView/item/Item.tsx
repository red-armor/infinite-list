import { ItemMeta } from '@infinite-list/data-model';
import React, { PropsWithChildren, memo } from 'react';

const Item = memo<
  PropsWithChildren<{
    viewableItemHelperKey: string;
    itemMeta: ItemMeta;
  }>
>(props => {
  const { children, ...rest } = props;
  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...rest,
    });
  }

  return <React.Fragment>{children}</React.Fragment>;
});

export default Item;
