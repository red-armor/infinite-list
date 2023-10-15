import { BaseLayoutProps } from './BaseLayout.types';
import { DimensionProps } from './Dimension.types';
import { ListDimensionsModelProps } from './ListDimensionsModel.types';
import { OnEndReached, OnEndReachedHelperProps } from './onEndReachedHelper.types';
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
  onUpdateItemLayout?: Function,
  onUpdateIntervalTree?: Function,
  recyclerTypes?: Array<string>;
}

export type RegisteredListProps<ItemT = {}> = ListDimensionsModelProps<ItemT> & OnEndReachedHelperProps
export type RegisteredDimensionProps = DimensionProps
export type KeyToListDimensionsMap = Map<string, ListDimensionsModel | Dimension>
export type KeyToOnEndReachedMap = Map<string, OnEndReached>