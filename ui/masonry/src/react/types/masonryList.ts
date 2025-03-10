import { ForwardedRef, RefObject } from 'react';
import { GenericItemT } from '@infinite-list/item-meta';
import {
  ColumnDimensionInfo,
  ColumnStateRendererProps,
  MasonryListProps as CommonMasonryListProps,
  RecycleItemProps,
  SpaceItemProps,
} from '../../types/masonryList';

export type ScrollerRef = RefObject<HTMLDivElement>;

export type MasonryListProps<ItemT extends GenericItemT = GenericItemT> =
  CommonMasonryListProps<ItemT> & {
    forwardRef?: ForwardedRef<HTMLDivElement>;
    scrollerRef?: ScrollerRef;
  };

export {
  RecycleItemProps,
  SpaceItemProps,
  ColumnStateRendererProps,
  ColumnDimensionInfo,
};
