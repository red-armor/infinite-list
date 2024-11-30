import {
  GenericItemT,
  RecycleStateToken,
  SpaceStateToken,
  MasonryDimension,
  MasonryColumnStateResults,
  MasonryDimensionsModelProps,
} from '@infinite-list/data-model';
import { View } from 'react-native';
import { RenderItem } from '../../types';
import { ForwardedRef } from 'react';

export type GetColumnWidth = (columnIndex: number) => number;

export type MasonryListProps<ItemT extends GenericItemT = GenericItemT> = Omit<
  MasonryDimensionsModelProps<ItemT>,
  'store' | 'container'
> & {
  id?: string;
  renderItem: RenderItem<ItemT>;
  getColumnWidth?: GetColumnWidth;
  forwardRef?: ForwardedRef<View>;
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
};
