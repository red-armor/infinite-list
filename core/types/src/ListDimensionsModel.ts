import { GenericItemT } from './generic.types';

export interface IListDimensionsModel<
  ItemT extends GenericItemT = GenericItemT
> {
  getItemKey(item: ItemT, index?: number): string | null;
}
