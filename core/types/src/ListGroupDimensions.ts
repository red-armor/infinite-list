import { GenericItemT } from './generic.types';
import { IOnEndReachedHelper } from './OnEndReachedHelper';
import { IListDimensionsModel } from './ListDimensionsModel';
import { IDimension } from './Dimension';

export interface IListGroupDimensions<
  ItemT extends GenericItemT = GenericItemT
> {
  getItemKey(item: ItemT, index?: number): string | null;
  onItemLayoutChanged(): void;
  onDataSourceChanged(): void;
  onEndReachedHelper: IOnEndReachedHelper;
  getFinalKeyIndexInfo: (
    itemKey: string,
    listKey: string
  ) => ListGroupIndexInfo<ItemT> | null;
}

export type ListGroupIndexInfo<ItemT extends GenericItemT = GenericItemT> = {
  dimensions: ListGroupChildDimensions<ItemT>;
  index: number;
  indexInGroup?: number;
  indexInRecycler?: number;
};

export type ListGroupChildDimensions<
  ItemT extends GenericItemT = GenericItemT
> = IListDimensionsModel<ItemT> | IDimension<ItemT>;
