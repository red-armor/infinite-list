import { GenericItemT } from './generic.types';

export interface IDimension<ItemT extends GenericItemT = GenericItemT> {
  getItemKey(item: ItemT, index?: number): string | null;
}
