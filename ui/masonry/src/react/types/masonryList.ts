import { GenericItemT } from '@infinite-list/item-meta';
import { ForwardedRef } from 'react';

import {
  MasonryListProps as CommonMasonryListProps,
  RecycleItemProps,
  SpaceItemProps,
  ColumnStateRendererProps,
  ColumnDimensionInfo,
} from '../../types/masonryList';

export type MasonryListProps<ItemT extends GenericItemT = GenericItemT> =
  CommonMasonryListProps<ItemT> & {
    forwardRef?: ForwardedRef<HTMLDivElement>;
  };

export {
  RecycleItemProps,
  SpaceItemProps,
  ColumnStateRendererProps,
  ColumnDimensionInfo,
};
