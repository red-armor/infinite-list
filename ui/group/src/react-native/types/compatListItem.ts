import { GenericItemT, ItemLayout } from '@infinite-list/types';
import { ListItemProps } from '../../types';
import { ViewStyle } from 'react-native';
import { ContainerRef } from './ListGroup.types';

export interface CompatListItemProps<ItemT extends GenericItemT>
  extends Omit<ListItemProps<ItemT>, 'ListItemWrapper'> {
  setDimensionItemLayout(key: string, values: ItemLayout): void;
  addItemChangedListener(fn: Function): void;
  style?: ViewStyle;
  containerRef: ContainerRef;
}
