import { ItemMeta } from '@infinite-list/item-meta';
import { ScrollComponentUseMeasureLayout } from './ListGroup.types';

import { ListItemProps, DefaultItemT } from './ListItem.types';
export type RenderItemInfo<ItemT extends DefaultItemT = DefaultItemT> = {
  item: ItemT;
  itemMeta: ItemMeta<ItemT>;
};

export type RenderItem<ItemT extends DefaultItemT = DefaultItemT> = (
  info: RenderItemInfo<ItemT>
) => React.ReactElement | null;
export interface GroupListItemImplProps<ItemT extends DefaultItemT>
  extends ListItemProps<ItemT> {
  renderItem: RenderItem<ItemT>;
  scrollComponentUseMeasureLayout?: ScrollComponentUseMeasureLayout;
}
