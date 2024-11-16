import { GenericItemT } from './generic.types';
import { ListDimensionsModelProps } from './ListDimensionsModel.types';

export interface MasonryDimensionsProps<
  ItemT extends GenericItemT = GenericItemT
> extends ListDimensionsModelProps<ItemT> {
  column?: number;
}
