import { GenericItemT } from './generic.types';
import { ItemMetaOwnerRequiredProps } from './itemMeta';
export interface IDimension<
  ItemT extends GenericItemT = GenericItemT,
  ExtraInfo extends {} = {}
> extends ItemMetaOwnerRequiredProps<ItemT> {
  getItemKey(item: ItemT, index?: number): string | null;
  extraInfo: ExtraInfo;
}
