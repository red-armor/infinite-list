import { GenericItemT, MasonryDimensionsProps } from '../types';
import MasonryDimensionsModel from './MasonryDimensionsModel';
import MasonryDimensionStrategy from './MasonryDimensionStrategy';

const DEFAULT_MASONRY_COLUMN = 2;

class MasonryDimensions<ItemT extends GenericItemT = GenericItemT> {
  private _dataModel: MasonryDimensionsModel<ItemT>;
  private _strategies: MasonryDimensionStrategy<ItemT>[];

  constructor(props: MasonryDimensionsProps<ItemT>) {
    this._dataModel = new MasonryDimensionsModel({
      column: DEFAULT_MASONRY_COLUMN,
      ...props,
    });

    this._strategies = Array.from(
      { length: this._dataModel.getColumn() },
      (_, i) => i
    ).map(
      (columnIndex) =>
        new MasonryDimensionStrategy({
          columnIndex,
          dataModel: this._dataModel,
          ...props,
        })
    );
  }
}

export default MasonryDimensions;
