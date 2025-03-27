import type MasonryDimensionsModel from '../masonry/MasonryDimensionsModel';
import type { GenericItemT } from './generic.types';
import type { ListIndexInfo } from './ItemMeta.types';
import type { ListBaseDimensionsProps,ListStateResult  } from './ListBaseDimensions.types';
import type { ListDimensionsModelProps } from './ListDimensionsModel.types';

export interface MasonryDimensionsProps<
  ItemT extends GenericItemT = GenericItemT
> extends Omit<ListDimensionsModelProps<ItemT>, 'store' | 'container'> {
  column?: number;
  stateListener?: MasonryStateListener<ItemT>;
}

export interface MasonryDimensionsModelProps<
  ItemT extends GenericItemT = GenericItemT
> extends Omit<ListDimensionsModelProps<ItemT>, 'store'> {
  column?: number;
  // container: MasonryDimensions<ItemT>
}

export type MasonryColumnStateResults<
  ItemT extends GenericItemT = GenericItemT
> = [ListStateResult<ItemT>, ListStateResult<ItemT>];
export type MasonryStateResults<ItemT extends GenericItemT = GenericItemT> =
  MasonryColumnStateResults<ItemT>[];

export type MasonryStateListener<ItemT extends GenericItemT = GenericItemT> = (
  stateResults: MasonryStateResults<ItemT>
) => void;

export interface MasonryDimensionStrategyProps<
  ItemT extends GenericItemT = GenericItemT
> extends Omit<ListBaseDimensionsProps, 'store' | 'container'> {
  columnIndex: number;
  dataModel: MasonryDimensionsModel<ItemT>;
}

export interface MasonryIndexInfo<ItemT extends GenericItemT = GenericItemT>
  extends ListIndexInfo<ItemT> {
  columnIndex: number;
  indexInTotal: number;
}
