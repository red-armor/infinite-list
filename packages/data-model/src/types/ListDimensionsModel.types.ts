import ListDimensions from '../ListDimensions';
import ListGroupDimensions from '../ListGroupDimensions';
import { BaseDimensionsProps } from './BaseDimensions.types';
import { GenericItemT } from './generic.types';
import { ListBaseDimensionsProps } from './ListBaseDimensions.types';

export type GetItemSeparatorLength<ItemT> = (
  data: Array<ItemT>,
  index: number
) => { length: number };
export type GetItemLayout<ItemT> = (
  data: Array<ItemT>,
  index: number
) => { length: number; index: number };
export type KeyExtractor<ItemT> = (item: ItemT, index: number) => string;

export interface ListDimensionsModelProps<
  ItemT extends GenericItemT = GenericItemT
> extends ListBaseDimensionsProps,
    BaseDimensionsProps {
  data: Array<ItemT>;
  itemApproximateLength?: number;
  useItemApproximateLength?: boolean;
  recyclerType?: string;
  anchorKey?: string;

  container: ListDimensionsModelContainer<ItemT>;

  recycleEnabled?: boolean;
  keyExtractor: KeyExtractor<ItemT>;
  getItemLayout?: GetItemLayout<ItemT>;
  getItemSeparatorLength?: GetItemSeparatorLength<ItemT>;

  isFixedLength?: boolean;

  onEndReachedThreshold?: number;

  /**
   * on default, value is false; In ListGroupDimensions, data should not
   * be initialized on construct . so add this param..
   */
  manuallyApplyInitialData?: boolean;

  recyclerTypes?: Array<string>;
}

export type ListDimensionsModelContainer<
  ItemT extends GenericItemT = GenericItemT
> = ListGroupDimensions<ItemT> | ListDimensions<ItemT>;
