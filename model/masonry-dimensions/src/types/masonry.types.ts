import { ListDimensionsModelProps } from '@infinite-list/dimensions-model';

import { GenericItemT } from './generic.types';
// import { ListDimensionsModelProps } from './ListDimensionsModel.types';
// import { ListStateResult } from './ListBaseDimensions.types';
import MasonryDimensionsModel from '../MasonryDimensionsModel';
import { ListIndexInfo } from '@infinite-list/item-meta';
// import { ListBaseDimensionsProps } from './ListBaseDimensions.types';

import {
  ListStateResult,
  ListBaseDimensionsProps,
} from '@infinite-list/strategies';

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
