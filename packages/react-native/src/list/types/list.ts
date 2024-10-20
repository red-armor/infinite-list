import {
  GenericItemT,
  ListDimensions,
  RecycleStateToken,
  SpaceStateToken,
  ListDimensionsModelProps,
} from '@infinite-list/data-model';
import { RefObject } from 'react';
import { ItemMeta } from '@infinite-list/data-model';
import { ScrollView, View } from 'react-native';

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
