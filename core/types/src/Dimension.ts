import { GenericItemT } from './generic.types';
import { ItemMetaOwnerRequiredProps } from './itemMeta';
export interface IDimension<ItemT extends GenericItemT = GenericItemT>
  extends ItemMetaOwnerRequiredProps<ItemT> {
  getItemKey(item: ItemT, index?: number): string | null;
}
