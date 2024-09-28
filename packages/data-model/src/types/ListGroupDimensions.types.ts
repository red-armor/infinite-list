import { BaseLayoutProps } from './BaseLayout.types';
import { DimensionProps } from './Dimension.types';
import { ListDimensionsModelProps } from './ListDimensionsModel.types';
import {
  OnEndReached,
  OnEndReachedHelperProps,
} from './onEndReachedHelper.types';
import { ViewabilityConfigTuplesProps } from './viewable.types';
import ListDimensionsModel from '../ListDimensionsModel';
import Dimension from '../Dimension';

export type ListRangeResult = Array<ListRange>;
export type ListRange = {
  listKey: string;
  isDimension: boolean;
  value: {
    startIndex: number;
    endIndex: number;
    data: Array<{
      [key: string]: any;
    }>;
  };
};

export interface ListGroupDimensionsProps
  extends BaseLayoutProps,
    OnEndReachedHelperProps,
    ViewabilityConfigTuplesProps {
  onUpdateItemLayout?: Function;
  onUpdateIntervalTree?: Function;
  recycleEnabled?: boolean;
  recyclerTypes?: Array<string>;
  isFixedLength?: boolean;
}

export type RegisteredListProps<
  ItemT extends {
    [key: string]: any;
  } = object
> = Omit<
  ListDimensionsModelProps<ItemT> & OnEndReachedHelperProps,
  'container' | 'id'
>;
export type RegisteredDimensionProps = Omit<DimensionProps, 'container' | 'id'>;
export type KeyToListDimensionsMap = Map<
  string,
  ListDimensionsModel | Dimension
>;
export type KeyToOnEndReachedMap = Map<string, OnEndReached>;

export type DimensionsIndexRange<
  ItemT extends {
    [key: string]: any;
  } = object
> = {
  dimensions: Dimension | ListDimensionsModel<ItemT>;
  startIndex: number;
  endIndex: number;

  startIndexInRecycler: number;
  endIndexInRecycler: number;
};
