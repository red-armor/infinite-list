import SelectValue from '@x-oasis/select-value';
import { IDimension } from './Dimension';
import { IListDimensionsModel } from './ListDimensionsModel';
import { GenericItemT } from './generic.types';
// import { IPseudoListDimensions } from './pseudoListDimensions';
import { IItemDimensions } from './itemDimensions';
import { ItemLayout } from './layout';

export type IItemMeta<
  ItemT extends GenericItemT = GenericItemT,
  ItemMetaOwnerExtraInfo extends object = Record<string, never>,
> = {
  isApproximateLayout: boolean;
  getLayout(): ItemLayout | undefined;
};

export type ItemMetaOwner<
  ItemT extends GenericItemT = GenericItemT,
  ItemMetaOwnerExtraInfo extends object = Record<string, never>,
> =
  | IListDimensionsModel<ItemT, ItemMetaOwnerExtraInfo>
  | IDimension<ItemT, ItemMetaOwnerExtraInfo>
  // | IPseudoListDimensions
  | IItemDimensions;

export type ItemMetaOwnerRequiredProps<
  ItemT extends GenericItemT = GenericItemT,
> = {
  resolveConfigTuplesDefaultState(defaultValue?: boolean): {
    [key: string]: boolean;
  };
  getContainerOffset(): number;
  getSelectValue(): SelectValue;
  getItemOffset?(): number;
  getIndexInfo(key: string): {
    index?: number;
  } | null;
  getKeyItemOffset(key: string, exclusive?: boolean): number;
  setKeyItemLayout(
    key: string,
    layout: ItemLayout | number,
    updateIntervalTree?: boolean
  ): boolean;
};
