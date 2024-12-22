import { GenericItemT } from './generic.types';
import { IOnEndReachedHelper } from './OnEndReachedHelper';
import { ListIndexInfo } from './ListDimensions';

export interface IMasonryDimensions<ItemT extends GenericItemT = GenericItemT> {
  getItemKey(item: ItemT, index?: number): string | null;
  onItemLayoutChanged(): void;
  onDataSourceChanged(): void;
  onEndReachedHelper: IOnEndReachedHelper;
  getFinalKeyIndexInfo(key: string): MasonryIndexInfo<ItemT>;
}

export interface IMasonryDimensionsModel<
  ItemT extends GenericItemT = GenericItemT
> {
  getItemKey(item: ItemT, index?: number): string | null;
}

export interface MasonryIndexInfo<ItemT extends GenericItemT = GenericItemT>
  extends ListIndexInfo<ItemT> {
  columnIndex: number;
  indexInTotal: number;
}
