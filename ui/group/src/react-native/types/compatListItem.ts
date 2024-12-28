import { GenericItemT, ItemLayout } from '@infinite-list/types';
import { ListItemProps } from '../../types';
import { ViewStyle } from 'react-native';

export interface CompatListItemProps<ItemT extends GenericItemT>
  extends ListItemProps<ItemT> {
  setDimensionItemLayout(key: string, values: ItemLayout): void;
  onItemChanged(fn: Function): void;
  style?: ViewStyle;
}
