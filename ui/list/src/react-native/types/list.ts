import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { GenericItemT } from '@infinite-list/types';
import { ListDimensions } from '@infinite-list/list-dimensions';
import { SpaceStateToken, RecycleStateToken } from '@infinite-list/strategies';
import { ListDimensionsModelProps } from '@infinite-list/dimensions-model';
import { ItemMeta } from '@infinite-list/item-meta';

export type RenderItemInfo<ItemT extends GenericItemT = GenericItemT> = {
  item: ItemT;
  itemMeta: ItemMeta<ItemT>;
};

export type DefaultItemT = {
  [key: string]: any;
};

export type RenderItem<ItemT extends DefaultItemT> = (
  info: RenderItemInfo<ItemT>
) => React.ReactElement | null;

export type ContainerRef = RefObject<ScrollView | View | any>;

export type ListProps<ItemT extends GenericItemT = GenericItemT> = Omit<
  ListDimensionsModelProps<ItemT>,
  'store' | 'container'
> & {
  renderItem: RenderItem<ItemT>;
  test: number | string | Function;
  containerRef: ContainerRef;
};

export type RecycleItemProps<ItemT extends GenericItemT = GenericItemT> = {
  data: RecycleStateToken<ItemT>;
  key: string;
  renderItem: RenderItem<ItemT>;
  dimensions: ListDimensions<ItemT>;
  containerRef: ContainerRef;
};

export type SpaceItemProps<ItemT extends GenericItemT = GenericItemT> = {
  data: SpaceStateToken<ItemT>;
  key: string;
  renderItem: RenderItem<ItemT>;
  dimensions: ListDimensions<ItemT>;
  containerRef: ContainerRef;
};
