import { CSSProperties } from 'react';
import { GenericItemT, ItemLayout } from '@infinite-list/types';
import { ListItemProps } from '../../types';

export interface CompatListItemProps<ItemT extends GenericItemT>
  extends Omit<ListItemProps<ItemT>, 'ListItemWrapper'> {
  setDimensionItemLayout(key: string, values: ItemLayout): void;
  addItemChangedListener(fn: Function): void;
  style?: CSSProperties;
}
