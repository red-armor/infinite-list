import { ListDimensionsModelProps } from '@infinite-list/dimensions-model';
import { OnEndReachedHelperProps } from '@infinite-list/viewable';
import { DefaultItemT, TeleportItemProps } from './ListItem.types';
import { RenderItem } from './GroupListItemImpl.types';

export interface GroupListProps<ItemT extends DefaultItemT>
  extends ListDimensionsModelProps<ItemT>,
    OnEndReachedHelperProps {
  renderItem: RenderItem<ItemT>;
  teleportItemProps?: TeleportItemProps;
}
