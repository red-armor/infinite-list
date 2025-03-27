import type {
  GenericItemT,
ItemMeta, 
  ListDimensions,
  ListDimensionsModelProps,
  RecycleStateToken,
  SpaceStateToken} from '@infinite-list/data-model';
import type { RefObject } from 'react';
import type { ScrollView, View } from 'react-native';

export type RenderItemInfo<ItemT extends GenericItemT = GenericItemT> = {
  item: ItemT;
  itemMeta: ItemMeta<ItemT>;
};

export type DefaultItemT = Record<string, any>;

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
