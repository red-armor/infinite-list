import { GenericItemT } from './generic.types';
import { ItemMetaOwnerRequiredProps } from './itemMeta';

export interface IListDimensionsModel<
  ItemT extends GenericItemT = GenericItemT,
  ExtraInfo extends object = Record<string, never>,
> extends ItemMetaOwnerRequiredProps<ItemT> {
  getItemKey(item: ItemT, index?: number): string | null;
  extraInfo: ExtraInfo;
}
