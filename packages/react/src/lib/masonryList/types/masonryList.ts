import type {
  GenericItemT,
  MasonryColumnStateResults,
  MasonryDimension,
  MasonryDimensionsModelProps,
  RecycleStateToken,
  SpaceStateToken,
} from '@infinite-list/data-model';
import type { ForwardedRef } from 'react';

import type { RenderItem } from '../../types';

export type GetColumnWidth = (columnIndex: number) => number;

export type MasonryListProps<ItemT extends GenericItemT = GenericItemT> = Omit<
  MasonryDimensionsModelProps<ItemT>,
  'store' | 'container'
> & {
  id?: string;
  renderItem: RenderItem<ItemT>;
  getColumnWidth?: GetColumnWidth;
  forwardRef?: ForwardedRef<HTMLDivElement>;
};

export type ColumnStateRendererProps<
  ItemT extends GenericItemT = GenericItemT
> = Omit<MasonryListProps<ItemT>, 'id' | 'column' | 'data' | 'forwardRef'> & {
  columnIndex: number;
  dimensions: MasonryDimension<ItemT>;
  state: MasonryColumnStateResults<ItemT>;
  columnDimensions: ColumnDimensionInfo[];
};

export type RecycleItemProps<ItemT extends GenericItemT = GenericItemT> = {
  columnIndex: number;
  data: RecycleStateToken<ItemT>;
  renderItem: RenderItem<ItemT>;
  dimensions: MasonryDimension<ItemT>;
  columnDimension: ColumnDimensionInfo;
};

export type SpaceItemProps<ItemT extends GenericItemT = GenericItemT> = {
  columnIndex: number;
  data: SpaceStateToken<ItemT>;
  renderItem: RenderItem<ItemT>;
  dimensions: MasonryDimension<ItemT>;
  columnDimension: ColumnDimensionInfo;
};

export type ColumnDimensionInfo = {
  width: number;
  left: number;
  right: number;
};
