import SelectValue from '@x-oasis/select-value';
import { GenericItemT } from './generic.types';
import { IListDimensionsModel } from './ListDimensionsModel';
import { IDimension } from './Dimension';
import { IPseudoListDimensions } from './pseudoListDimensions';
import { IItemDimensions } from './itemDimensions';

export type IItemMeta<ItemT extends GenericItemT = GenericItemT> = {};

export type ItemMetaOwner<ItemT extends GenericItemT = GenericItemT> =
  | IListDimensionsModel<ItemT>
  | IDimension<ItemT>
  | IPseudoListDimensions
  | IItemDimensions;

export type ItemMetaOwnerRequiredProps<
  ItemT extends GenericItemT = GenericItemT
> = {
  resolveConfigTuplesDefaultState(defaultValue?: boolean): {
    [key: string]: boolean;
  };
  getContainerOffset(): number;
  getSelectValue(): SelectValue;
  getItemOffset(): number;
  getIndexInfo(key: string): {
    index?: number;
  };
  getKeyItemOffset(key: string, exclusive?: boolean): number;
};
