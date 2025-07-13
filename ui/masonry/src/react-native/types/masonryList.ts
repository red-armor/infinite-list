import { ForwardedRef, RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { GenericItemT } from '@infinite-list/item-meta';
import type {
  ColumnDimensionInfo,
  ColumnStateRendererProps as CommonColumnStateRendererProps,
  MasonryListProps as CommonMasonryListProps,
  RecycleItemProps as CommonRecycleItemProps,
  SpaceItemProps as CommonSpaceItemProps,
} from '../../types/masonryList';

export { ColumnDimensionInfo };

export type ScrollerRef = RefObject<ScrollView | View | any>;
export type MasonryListProps<ItemT extends GenericItemT = GenericItemT> =
  CommonMasonryListProps<ItemT> & {
    scrollerRef: ScrollerRef;
    forwardRef?: ForwardedRef<View>;
    containerRef: any;
  };

export type RecycleItemProps<ItemT extends GenericItemT = GenericItemT> =
  CommonRecycleItemProps<ItemT> & {
    scrollerRef: ScrollerRef;
    containerRef: any;
  };

export type SpaceItemProps<ItemT extends GenericItemT = GenericItemT> =
  CommonSpaceItemProps<ItemT> & {
    scrollerRef: ScrollerRef;
    containerRef: any;
  };
export type ColumnStateRendererProps<
  ItemT extends GenericItemT = GenericItemT,
> = CommonColumnStateRendererProps<ItemT> & {
  scrollerRef: ScrollerRef;
  containerRef: any;
};
