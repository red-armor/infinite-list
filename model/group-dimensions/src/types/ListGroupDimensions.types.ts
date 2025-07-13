import {
  BaseLayoutProps,
  OnUpdateIntervalTree,
  OnUpdateItemLayout,
} from '@infinite-list/base-dimensions';
import { Dimension, DimensionProps } from '@infinite-list/dimension';
import { ListDimensionsModel } from '@infinite-list/dimensions-model';
import { ListDimensionsModelProps } from '@infinite-list/dimensions-model';
import {
  OnEndReached,
  OnEndReachedHelperProps,
  ViewabilityConfigTuplesProps,
} from '@infinite-list/viewable';
import ListGroupDimensions from '../ListGroupDimensions';
import { GenericItemT } from './generic.types';

export type ListRangeResult<ItemT> = ListRange<ItemT>[];
export type ListRange<ItemT> =
  | {
      listKey: string;
      isDimension: boolean;
      value: {
        startIndex: number;
        endIndex: number;
        data: ItemT[];
      };
    }
  | {
      listKey: string;
      isDimension: boolean;
    };

export interface ListGroupDimensionsProps
  extends BaseLayoutProps,
    OnEndReachedHelperProps,
    ViewabilityConfigTuplesProps {
  onUpdateItemLayout?: OnUpdateItemLayout;
  onUpdateIntervalTree?: OnUpdateIntervalTree;
  recycleEnabled?: boolean;
  recyclerTypes?: Array<string>;
  isFixedLength?: boolean;
}

export type RegisteredListProps<ItemT extends GenericItemT = GenericItemT> =
  Omit<
    ListDimensionsModelProps<ItemT> & OnEndReachedHelperProps,
    'container' | 'id' | 'store'
  >;
export type RegisteredDimensionProps<
  ItemT extends GenericItemT = GenericItemT,
> = Omit<DimensionProps<ItemT>, 'container' | 'id' | 'store'>;

export type KeyToOnEndReachedMap = Map<string, OnEndReached>;

export type DimensionsIndexRange<ItemT extends GenericItemT = GenericItemT> = {
  dimensions: ListGroupChildDimensions<ItemT>;
  startIndex: number;
  endIndex: number;

  startIndexInRecycler: number;
  endIndexInRecycler: number;
};

// export type ListGroupDimensionsModelContainer<
//   ItemT extends GenericItemT = GenericItemT
// > = ListGroupDimensions<ItemT>;
// export type ListGroupDimensionsModelContainer<
//   ItemT extends GenericItemT = GenericItemT
// > = ListGroupDimensions<ItemT> | ListDimensions<ItemT>;

export type ListGroupChildDimensions<
  ItemT extends GenericItemT = GenericItemT,
> = ListDimensionsModel<ItemT> | Dimension<ItemT>;

export type ListGroupChildDimensionsContainer<
  ItemT extends GenericItemT = GenericItemT,
> = ListGroupDimensions<ItemT>;

export type ListGroupIndexInfo<ItemT extends GenericItemT = GenericItemT> = {
  dimensions: ListGroupChildDimensions<ItemT>;
  index: number;
  indexInGroup?: number;
  indexInRecycler?: number;
};
