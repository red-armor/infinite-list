import {
  GenericItemT,
  ListDimensions,
  RecycleStateToken,
  ListDimensionsModelProps,
} from '@infinite-list/data-model';

import { ItemMeta } from '@infinite-list/data-model';

export type RenderItemInfo<ItemT> = {
  item: ItemT;
  itemMeta: ItemMeta;
};

export type DefaultItemT = {
  [key: string]: any;
};

export type RenderItem<ItemT extends DefaultItemT> = (
  info: RenderItemInfo<ItemT>
) => React.ReactElement | null;

export type ListProps<ItemT extends GenericItemT = GenericItemT> = Omit<
  ListDimensionsModelProps<ItemT>,
  'store' | 'container'
> & {
  renderItem: RenderItem<ItemT>;
};

export type ItemProps<ItemT extends GenericItemT = GenericItemT> = {
  data: RecycleStateToken<ItemT>;
  key: string;
  renderItem: RenderItem<ItemT>;
  dimensions: ListDimensions<ItemT>;
};
