import { ListDimensionsModelProps } from '@infinite-list/dimensions-model';
import { OnEndReachedHelperProps } from '@infinite-list/viewable';
import { RenderItem } from './GroupListItemImpl.types';
import { DefaultItemT, TeleportItemProps } from './ListItem.types';

export interface GroupListProps<ItemT extends DefaultItemT>
  extends ListDimensionsModelProps<ItemT>,
    OnEndReachedHelperProps {
  renderItem: RenderItem<ItemT>;
  teleportItemProps?: TeleportItemProps<ItemT>;
  /**
   * @type {string} id
   */
  id: string;
}
