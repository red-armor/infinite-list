import type { IDimension } from './Dimension';
import type { IListDimensionsModel } from './ListDimensionsModel';
import type { IOnEndReachedHelper } from './OnEndReachedHelper';
import type { GenericItemT } from './generic.types';
import type { IItemMeta } from './itemMeta';

export interface IListGroupDimensions<
  ItemT extends GenericItemT = GenericItemT,
> {
  maxToRenderPerBatch: number;
  getItemKey: (item: ItemT, index?: number) => string | null;
  onItemLayoutChanged: () => void;
  onDataSourceChanged: () => void;
  onEndReachedHelper: IOnEndReachedHelper;
  getFinalKeyIndexInfo: (
    itemKey: string,
    listKey: string
  ) => ListGroupIndexInfo<ItemT> | null;

  /**
   * for state start
   */
  getDataLength: () => number;
  initialNumToRender: number;
  getTotalLength: () => number;
  getBufferSize: () => number;
  computeIndexRange: (
    minOffset: number,
    maxOffset: number
  ) => {
    startIndex: number;
    endIndex: number;
  };
  // inherit from BaseLayout
  resolveOffsetRange: (
    minOffset: number,
    maxOffset: number,
    exclusive?: boolean
  ) => {
    minOffset: number;
    maxOffset: number;
  };
  getIndexItemMeta: (index: number) => IItemMeta<ItemT>;

  getContainerOffset: () => number;
  hasUnLayoutItems: () => boolean;
  getOnEndReachedHelper: () => IOnEndReachedHelper;

  /**
   * for state end
   */
}

export type ListGroupIndexInfo<ItemT extends GenericItemT = GenericItemT> = {
  dimensions: ListGroupChildDimensions<ItemT>;
  index: number;
  indexInGroup?: number;
  indexInRecycler?: number;
};

export type ListGroupChildDimensions<
  ItemT extends GenericItemT = GenericItemT,
> = IListDimensionsModel<ItemT> | IDimension<ItemT>;
