import type SelectValue from '@x-oasis/select-value';

import type { IDimension } from './Dimension';
import type { GenericItemT } from './generic.types';
// import { IPseudoListDimensions } from './pseudoListDimensions';
import type { IItemDimensions } from './itemDimensions';
import type { ItemLayout } from './layout';
import type { IListDimensionsModel } from './ListDimensionsModel';

export type IItemMeta<
  ItemT extends GenericItemT = GenericItemT,
  ItemMetaOwnerExtraInfo extends {} = {},
> = {
  isApproximateLayout: boolean;
  getLayout: () => ItemLayout | undefined;
};

export type ItemMetaOwner<
  ItemT extends GenericItemT = GenericItemT,
  ItemMetaOwnerExtraInfo extends {} = {},
> =
  | IListDimensionsModel<ItemT, ItemMetaOwnerExtraInfo>
  | IDimension<ItemT, ItemMetaOwnerExtraInfo>
  // | IPseudoListDimensions
  | IItemDimensions;

export type ItemMetaOwnerRequiredProps<
  ItemT extends GenericItemT = GenericItemT,
> = {
  resolveConfigTuplesDefaultState: (defaultValue?: boolean) => Record<string, boolean>;
  getContainerOffset: () => number;
  getSelectValue: () => SelectValue;
  getItemOffset?: () => number;
  getIndexInfo: (key: string) => {
    index?: number;
  } | null;
  getKeyItemOffset: (key: string, exclusive?: boolean) => number;
  setKeyItemLayout: (
    key: string,
    layout: ItemLayout | number,
    updateIntervalTree?: boolean
  ) => boolean;
};
