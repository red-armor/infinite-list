import { GenericItemT, ItemLayout } from '@infinite-list/types';
import { ListItemProps } from '../../types';
import { CSSProperties } from 'react';

export interface CompatListItemProps<ItemT extends GenericItemT>
  extends ListItemProps<ItemT> {
  setDimensionItemLayout(key: string, values: ItemLayout): void;
  onItemChanged(fn: Function): void;
  style?: CSSProperties;
}
