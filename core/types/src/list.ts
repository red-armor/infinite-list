import { GenericItemT } from './generic.types';
import { IItemMeta } from './itemMeta';

export type RenderItemInfo<ItemT extends GenericItemT = GenericItemT> = {
  item: ItemT;
  itemMeta: IItemMeta<ItemT>;
};

export type DefaultItemT = {
  [key: string]: unknown;
};

// export type RenderItem<ItemT extends DefaultItemT> = (
//   info: RenderItemInfo<ItemT>
// ) => React.ReactElement | null;

// export type ListProps<ItemT extends GenericItemT = GenericItemT> = Omit<
//   ListDimensionsModelProps<ItemT>,
//   'store' | 'container'
// > & {
//   renderItem: RenderItem<ItemT>;
// };

// export type RecycleItemProps<ItemT extends GenericItemT = GenericItemT> = {
//   data: RecycleStateToken<ItemT>;
//   // key: string;
//   renderItem: RenderItem<ItemT>;
//   dimensions: ListDimensions<ItemT>;
// };

// export type SpaceItemProps<ItemT extends GenericItemT = GenericItemT> = {
//   data: SpaceStateToken<ItemT>;
//   // key: string;
//   renderItem: RenderItem<ItemT>;
//   dimensions: ListDimensions<ItemT>;
// };
