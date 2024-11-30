import { ItemMeta } from '@infinite-list/data-model';
import { ScrollComponentUseMeasureLayout } from './ListGroup.types';

import { ListItemProps, DefaultItemT } from './ListItem.types';
export type RenderItemInfo<ItemT> = {
  item: ItemT;
  itemMeta: ItemMeta;
};

export type RenderItem<ItemT extends DefaultItemT> = (
  info: RenderItemInfo<ItemT>
) => React.ReactElement | null;
export interface GroupListItemImplProps<ItemT extends DefaultItemT>
  extends ListItemProps<ItemT> {
  renderItem: RenderItem<ItemT>;
  scrollComponentUseMeasureLayout: ScrollComponentUseMeasureLayout;
}
