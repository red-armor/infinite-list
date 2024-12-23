import { ListDimensionsModelProps } from '@infinite-list/dimensions-model';
import { OnEndReachedHelperProps } from '@infinite-list/viewable';
import { DefaultItemT } from './ListItem.types';

export interface GroupListProps<ItemT extends DefaultItemT>
  extends ListDimensionsModelProps<ItemT>,
    OnEndReachedHelperProps {}
