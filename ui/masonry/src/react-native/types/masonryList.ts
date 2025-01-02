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

export type ScrollerRef = RefObject<ScrollView | View | any>;
export type MasonryListProps<ItemT extends GenericItemT = GenericItemT> =
  CommonMasonryListProps<ItemT> & {
    scrollerRef: ScrollerRef;
    forwardRef?: ForwardedRef<View>;
  };

export type RecycleItemProps<ItemT extends GenericItemT = GenericItemT> =
  CommonRecycleItemProps<ItemT> & {
    scrollerRef: ScrollerRef;
  };

export type SpaceItemProps<ItemT extends GenericItemT = GenericItemT> =
  CommonSpaceItemProps<ItemT> & {
    scrollerRef: ScrollerRef;
  };
export type ColumnStateRendererProps<
  ItemT extends GenericItemT = GenericItemT
> = CommonColumnStateRendererProps<ItemT> & {
  scrollerRef: ScrollerRef;
};
