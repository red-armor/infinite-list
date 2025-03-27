import type {
  ListDimensionsModelProps,
  OnEndReachedHelperProps,
} from '@infinite-list/data-model';

import type { RenderItem } from './GroupListItemImpl.types';
import type { DefaultItemT, TeleportItemProps } from './ListItem.types';

export interface GroupListProps<ItemT extends DefaultItemT>
  extends ListDimensionsModelProps<ItemT>,
    OnEndReachedHelperProps {
  renderItem: RenderItem<ItemT>;
  teleportItemProps?: TeleportItemProps;
}
