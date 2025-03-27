import type {
  ListDimensionsModelProps,
  OnEndReachedHelperProps,
} from '@infinite-list/data-model';

import type { DefaultItemT } from './ListItem.types';

export interface GroupListProps<ItemT extends DefaultItemT>
  extends ListDimensionsModelProps<ItemT>,
    OnEndReachedHelperProps {}
