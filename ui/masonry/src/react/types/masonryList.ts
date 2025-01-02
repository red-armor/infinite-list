import { GenericItemT } from '@infinite-list/item-meta';
import { ForwardedRef, RefObject } from 'react';

import {
  MasonryListProps as CommonMasonryListProps,
  RecycleItemProps,
  SpaceItemProps,
  ColumnStateRendererProps,
  ColumnDimensionInfo,
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
