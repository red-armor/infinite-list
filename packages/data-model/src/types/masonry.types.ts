import { GenericItemT } from './generic.types';
import { ListDimensionsModelProps } from './ListDimensionsModel.types';
import { ListStateResult } from './ListBaseDimensions.types';
import MasonryDimensionsModel from '../masonry/MasonryDimensionsModel';
import { ListIndexInfo } from './ItemMeta.types';
import { ListBaseDimensionsProps } from './ListBaseDimensions.types';

export interface MasonryDimensionsProps<
  ItemT extends GenericItemT = GenericItemT
> extends Omit<ListDimensionsModelProps<ItemT>, 'store' | 'container'> {
  column?: number;
}

export interface MasonryDimensionsModelProps<
  ItemT extends GenericItemT = GenericItemT
> extends Omit<ListDimensionsModelProps<ItemT>, 'store'> {
  column?: number;
  // container: MasonryDimensions<ItemT>
}

export type MasonryStateListener<ItemT extends GenericItemT = GenericItemT> = (
  stateResults: [ListStateResult<ItemT>, ListStateResult<ItemT>][]
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
