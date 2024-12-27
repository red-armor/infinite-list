import { ScrollView, View } from 'react-native';
import { RefObject, ForwardedRef } from 'react';
import { GenericItemT } from '@infinite-list/item-meta';
import {
  MasonryListProps as CommonMasonryListProps,
  RecycleItemProps as CommonRecycleItemProps,
  SpaceItemProps as CommonSpaceItemProps,
  ColumnStateRendererProps as CommonColumnStateRendererProps,
  ColumnDimensionInfo,
} from '../../types/masonryList';

export { ColumnDimensionInfo };

export type ContainerRef = RefObject<ScrollView | View | any>;
export type MasonryListProps<ItemT extends GenericItemT = GenericItemT> =
  CommonMasonryListProps<ItemT> & {
    containerRef: ContainerRef;
    forwardRef?: ForwardedRef<View>;
  };

export type RecycleItemProps<ItemT extends GenericItemT = GenericItemT> =
  CommonRecycleItemProps<ItemT> & {
    containerRef: ContainerRef;
  };

export type SpaceItemProps<ItemT extends GenericItemT = GenericItemT> =
  CommonSpaceItemProps<ItemT> & {
    containerRef: ContainerRef;
  };
export type ColumnStateRendererProps<
  ItemT extends GenericItemT = GenericItemT
> = CommonColumnStateRendererProps<ItemT> & {
  containerRef: ContainerRef;
};
