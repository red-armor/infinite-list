import {
  BaseDimensionsProps,
  KeysChangedType,
} from '@infinite-list/base-dimensions';
import { GenericItemT } from './generic.types';
import { ListBaseDimensionsProps } from './ListBaseDimensions.types';

import {
  IListDimensions,
  IListDimensionsModel,
  IListGroupDimensions,
  IMasonryDimensions,
  IMasonryDimensionsModel,
} from '@infinite-list/types';
import { IDefaultKeyExtra } from '@infinite-list/utils';

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
export type KeyExtractor<ItemT extends GenericItemT = GenericItemT> = (
  item: ItemT,
  index?: number
) => string;
export type OnListDimensionsModelDataChanged<
  ItemT extends GenericItemT = GenericItemT
> = (props: {
  dataModel: IListDimensionsModel<ItemT> | IMasonryDimensionsModel<ItemT>;
  dataChangedType: KeysChangedType;
  data: ItemT[];
  oldData: ItemT[];
}) => void;

export interface ListDimensionsModelProps<
  ItemT extends GenericItemT = GenericItemT
> extends ListBaseDimensionsProps,
    BaseDimensionsProps {
  /**
   * @template ItemT the generic data item type
   */
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

  /**
   * @template ItemT the generic date item type
   * @type {( item: ItemPossibleT<ItemT>, index?: number ) => string }
   *
   * @param {number} index maybe removed in the future
   *
   * Used to extract a unique key for a given item at the specified index. Key is used for caching
   * and as the react key to track item re-ordering. The default extractor checks `item.key`, then
   * falls back to using the index, like React does.
   */
  keyExtractor: IDefaultKeyExtra<ItemT>;

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
  | IListGroupDimensions<ItemT>
  | IListDimensions<ItemT>
  | IMasonryDimensions<ItemT>;
