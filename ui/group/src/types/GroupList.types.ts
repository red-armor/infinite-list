import type { ListDimensionsModelProps } from '@infinite-list/dimensions-model';
import type { OnEndReachedHelperProps } from '@infinite-list/viewable';

import type { RenderItem } from './GroupListItemImpl.types';
import type { DefaultItemT, TeleportItemProps } from './ListItem.types';

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
