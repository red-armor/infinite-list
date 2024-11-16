import MasonryDimensionsModel from '../masonry/MasonryDimensionsModel';
import { GenericItemT } from './generic.types';
import { ListIndexInfo } from './ItemMeta.types';
import { ListBaseDimensionsProps } from './ListBaseDimensions.types';

export interface MasonryDimensionStrategyProps<
  ItemT extends GenericItemT = GenericItemT
> extends ListBaseDimensionsProps {
  columnIndex: number;
  dataModel: MasonryDimensionsModel<ItemT>;
}

export interface MasonryIndexInfo<ItemT extends GenericItemT = GenericItemT>
  extends ListIndexInfo<ItemT> {
  columnIndex: number;
  indexInTotal: number;
}
