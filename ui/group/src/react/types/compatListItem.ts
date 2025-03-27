import type { GenericItemT, ItemLayout } from '@infinite-list/types';
import type { CSSProperties } from 'react';

import type { ListItemProps } from '../../types';

export interface CompatListItemProps<ItemT extends GenericItemT>
  extends Omit<ListItemProps<ItemT>, 'ListItemWrapper'> {
  setDimensionItemLayout: (key: string, values: ItemLayout) => void;
  addItemChangedListener: (fn: Function) => void;
  style?: CSSProperties;
}
