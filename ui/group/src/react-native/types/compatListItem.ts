import { ViewStyle } from 'react-native';
import { GenericItemT, ItemLayout } from '@infinite-list/types';
import { ListItemProps } from '../../types';
import { ContainerRef } from './ListGroup.types';

export interface CompatListItemProps<ItemT extends GenericItemT>
  extends Omit<ListItemProps<ItemT>, 'ListItemWrapper'> {
  setDimensionItemLayout(key: string, values: ItemLayout): void;
  addItemChangedListener(fn: () => void): void;
  style?: ViewStyle;
  containerRef: ContainerRef;
}
