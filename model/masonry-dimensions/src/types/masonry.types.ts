import type { ListDimensionsModelProps } from '@infinite-list/dimensions-model';
import type { ListIndexInfo } from '@infinite-list/item-meta';
import type {
  ListBaseDimensionsProps,
  ListStateResult,
} from '@infinite-list/strategies';
import type { TheHostProps } from '@infinite-list/types';

import type MasonryDimensionsModel from '../MasonryDimensionsModel';
import type { GenericItemT } from './generic.types';

export interface MasonryDimensionsProps<
  ItemT extends GenericItemT = GenericItemT,
> extends Omit<ListDimensionsModelProps<ItemT>, 'store' | 'container'> {
  column?: number;
  stateListener?: MasonryStateListener<ItemT>;
}

export interface MasonryDimensionsModelProps<
  ItemT extends GenericItemT = GenericItemT,
> extends Omit<ListDimensionsModelProps<ItemT>, 'store'>,
    TheHostProps {
  column?: number;
}

export type MasonryColumnStateResults<
  ItemT extends GenericItemT = GenericItemT,
> = [ListStateResult<ItemT>, ListStateResult<ItemT>];
export type MasonryStateResults<ItemT extends GenericItemT = GenericItemT> =
  MasonryColumnStateResults<ItemT>[];

export type MasonryStateListener<ItemT extends GenericItemT = GenericItemT> = (
  stateResults: MasonryStateResults<ItemT>
) => void;

export interface MasonryDimensionStrategyProps<
  ItemT extends GenericItemT = GenericItemT,
> extends Omit<ListBaseDimensionsProps, 'store' | 'container'> {
  columnIndex: number;
  dataModel: MasonryDimensionsModel<ItemT>;
}

export interface MasonryIndexInfo<ItemT extends GenericItemT = GenericItemT>
  extends ListIndexInfo<ItemT> {
  columnIndex: number;
  indexInTotal: number;
}
