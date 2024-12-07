import {
  ListDimensionsModelProps,
  OnEndReachedHelperProps,
} from '@infinite-list/data-model';
import { DefaultItemT, TeleportItemProps } from './ListItem.types';
import { RenderItem } from './GroupListItemImpl.types';

export interface GroupListProps<ItemT extends DefaultItemT>
  extends ListDimensionsModelProps<ItemT>,
    OnEndReachedHelperProps {
  renderItem: RenderItem<ItemT>;
  teleportItemProps?: TeleportItemProps;
}
