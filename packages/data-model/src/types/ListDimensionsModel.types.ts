import ListDimensions from '../ListDimensions';
import ListGroupDimensions from '../ListGroupDimensions';
import { BaseDimensionsProps } from './BaseDimensions.types';

export type GetItemSeparatorLength<ItemT> = (
  data: Array<ItemT>,
  index: number
) => { length: number };
export type GetItemLayout<ItemT> = (
  data: Array<ItemT>,
  index: number
) => { length: number; index: number };
export type KeyExtractor<ItemT> = (item: ItemT, index: number) => string;

export interface ListDimensionsModelProps<ItemT> extends BaseDimensionsProps {
  data: Array<ItemT>;
  itemApproximateLength?: number;
  useItemApproximateLength?: boolean;
  recyclerType?: string;
  anchorKey?: string;

  container: ListDimensionsModelContainer;

  recycleEnabled?: boolean;
  keyExtractor: KeyExtractor<ItemT>;
  getItemLayout?: GetItemLayout<ItemT>;
  getItemSeparatorLength?: GetItemSeparatorLength<ItemT>;
}

export type ListDimensionsModelContainer = ListGroupDimensions | ListDimensions;
