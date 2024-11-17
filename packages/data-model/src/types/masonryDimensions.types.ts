import { GenericItemT } from './generic.types';
import { ListDimensionsModelProps } from './ListDimensionsModel.types';
import { ListStateResult } from './ListBaseDimensions.types';

export interface MasonryDimensionsProps<
  ItemT extends GenericItemT = GenericItemT
> extends ListDimensionsModelProps<ItemT> {
  column?: number;
}

export type MasonryStateListener<ItemT extends GenericItemT = GenericItemT> = (
  stateResults: [ListStateResult<ItemT>, ListStateResult<ItemT>][]
) => void;
