import type { ViewStyle } from 'react-native';
import type { GenericItemT, ItemLayout } from '@infinite-list/types';
import type { ListItemProps } from '../../types';
import type { ContainerRef } from './ListGroup.types';

export interface CompatListItemProps<ItemT extends GenericItemT>
  extends Omit<ListItemProps<ItemT>, 'ListItemWrapper'> {
  setDimensionItemLayout: (key: string, values: ItemLayout) => void;
  addItemChangedListener: (fn: Function) => void;
  style?: ViewStyle;
  containerRef: ContainerRef;
}
