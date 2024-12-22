import {
  BaseDimensionsProps,
  KeysChangedType,
} from '@infinite-list/base-dimensions';
import { GenericItemT } from './generic.types';
import { ListBaseDimensionsProps } from './ListBaseDimensions.types';
import ListGroupDimensions from '../ListGroupDimensions';
import ListDimensions from '../ListDimensions';
import MasonryDimensions from '../masonry/MasonryDimensions';
import ListDimensionsModel from '../ListDimensionsModel';
import MasonryDimensionsModel from '../masonry/MasonryDimensionsModel';

export type GetItemSeparatorLength<ItemT> = (
  data: Array<ItemT>,
  index: number
) => { length: number };
export type GetItemLayout<ItemT> = (
  data: Array<ItemT>,
  index: number
) => { length: number; index: number };

/**
 * TODO: `index` may not be
 */
export type KeyExtractor<ItemT> = (item: ItemT, index?: number) => string;
export type OnListDimensionsModelDataChanged<
  ItemT extends GenericItemT = GenericItemT
> = (props: {
  dataModel: ListDimensionsModel<ItemT> | MasonryDimensionsModel<ItemT>;
  dataChangedType: KeysChangedType;
  data: ItemT[];
  oldData: ItemT[];
}) => void;

export interface ListDimensionsModelProps<
  ItemT extends GenericItemT = GenericItemT
> extends ListBaseDimensionsProps,
    BaseDimensionsProps {
  data: Array<ItemT>;
  itemApproximateLength?: number;
  /**
   * only if in recycleEnabled mode, `useItemApproximateLength` is meaningful
   */
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

  onListDimensionsModelDataChanged?: OnListDimensionsModelDataChanged<ItemT>;
}

export type ListDimensionsModelContainer<
  ItemT extends GenericItemT = GenericItemT
> =
  | ListGroupDimensions<ItemT>
  | ListDimensions<ItemT>
  | MasonryDimensions<ItemT>;
