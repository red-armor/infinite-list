import type { ListDimensionsModelProps } from '@infinite-list/dimensions-model';
import type { ItemMeta } from '@infinite-list/item-meta';
import type { ListDimensions } from '@infinite-list/list-dimensions';
import type { RecycleStateToken, SpaceStateToken } from '@infinite-list/strategies';
import type { GenericItemT } from '@infinite-list/types';

export type RenderItemInfo<ItemT extends GenericItemT = GenericItemT> = {
  /**
   * @type ItemT generic type
   */
  item: ItemT;
  /**
   * @type itemMeta
   */
  itemMeta: ItemMeta<ItemT>;
};

export type DefaultItemT = Record<string, any>;

export type RenderItem<ItemT extends DefaultItemT> = (
  info: RenderItemInfo<ItemT>
) => React.ReactElement | null;

export interface ListProps<ItemT extends GenericItemT = GenericItemT>
  extends Omit<
    ListDimensionsModelProps<ItemT>,
    'store' | 'container'
    // 'store' | 'container' | 'keyExtractor'
  > {
  /**
   * @template ItemT the generic data item type
   * @type {(info: { item: ItemT, itemMeta: ItemMeta<ItemT> }) => JSX}
   *
   * ItemMeta @see {@link ItemMeta}
   */
  renderItem: RenderItem<ItemT>;

  horizontal?: boolean;

  // /**
  //  * @template ItemT the generic date item type
  //  * @type {( item: ItemPossibleT<ItemT>, index?: number ) => string }
  //  *
  //  * @param {number} index maybe removed in the future
  //  *
  //  * Used to extract a unique key for a given item at the specified index. Key is used for caching
  //  * and as the react key to track item re-ordering. The default extractor checks `item.key`, then
  //  * falls back to using the index, like React does.
  //  */
  // keyExtractor: IDefaultKeyExtra<ItemT>;
}
// export type ListProps<ItemT extends GenericItemT = GenericItemT> = Omit<
//   ListDimensionsModelProps<ItemT>,
//   'store' | 'container' | 'keyExtractor'
// > & {
//   /**
//    * @template ItemT the generic data item type
//    * @type {(info: { item: ItemT, itemMeta: ItemMeta<ItemT> }) => JSX}
//    *
//    * ItemMeta @see {@link ItemMeta}
//    */
//   renderItem: RenderItem<ItemT>;

//   /**
//    * @template ItemT the generic date item type
//    * @type {( item: ItemPossibleT<ItemT>, index?: number ) => string }
//    *
//    * @param {number} index maybe removed in the future
//    *
//    * Used to extract a unique key for a given item at the specified index. Key is used for caching
//    * and as the react key to track item re-ordering. The default extractor checks `item.key`, then
//    * falls back to using the index, like React does.
//    */
//   keyExtractor: IDefaultKeyExtra<ItemT>;
// };

export type RecycleItemProps<ItemT extends GenericItemT = GenericItemT> = {
  horizontal: boolean;
  data: RecycleStateToken<ItemT>;
  renderItem: RenderItem<ItemT>;
  dimensions: ListDimensions<ItemT>;
};

export type SpaceItemProps<ItemT extends GenericItemT = GenericItemT> = {
  data: SpaceStateToken<ItemT>;
  horizontal: boolean;
  renderItem: RenderItem<ItemT>;
  dimensions: ListDimensions<ItemT>;
};
