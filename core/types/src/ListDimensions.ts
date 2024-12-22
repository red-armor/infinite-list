import { GenericItemT } from './generic.types';
import { IListDimensionsModel } from './ListDimensionsModel';
import { IOnEndReachedHelper } from './OnEndReachedHelper';

export interface IListDimensions<ItemT extends GenericItemT = GenericItemT> {
  onItemLayoutChanged: () => void;
  onDataSourceChanged(): void;
  onEndReachedHelper: IOnEndReachedHelper;
  getFinalKeyIndexInfo: (
    itemKey: string,
    listKey: string
  ) => ListIndexInfo<ItemT>;
}

export type ListIndexInfo<ItemT extends GenericItemT = GenericItemT> = {
  dimensions: IListDimensionsModel<ItemT>;
  index?: number;
};
