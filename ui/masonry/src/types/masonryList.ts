import {
  MasonryDimensions as MasonryDimension,
  MasonryColumnStateResults,
  MasonryDimensionsModelProps,
} from '@infinite-list/masonry-dimensions';
import { RecycleStateToken, SpaceStateToken } from '@infinite-list/strategies';
import { GenericItemT } from '@infinite-list/item-meta';
import { RenderItem } from './list';

export type GetColumnWidth = (columnIndex: number) => number;

export type MasonryListProps<ItemT extends GenericItemT = GenericItemT> = Omit<
  MasonryDimensionsModelProps<ItemT>,
  'store' | 'container'
> & {
  id?: string;
  renderItem: RenderItem<ItemT>;
  getColumnWidth?: GetColumnWidth;
};

export type ColumnStateRendererProps<
  ItemT extends GenericItemT = GenericItemT
> = Omit<MasonryListProps<ItemT>, 'id' | 'column' | 'data' | 'forwardRef'> & {
  columnIndex: number;
  horizontal: boolean;
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
