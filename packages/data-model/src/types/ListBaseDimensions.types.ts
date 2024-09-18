import ItemMeta from '../ItemMeta';
// import ListDimensions from '../ListDimensions';
// import ListGroupDimensions from '../ListGroupDimensions';
import { BaseLayoutProps } from './BaseLayout.types';
import { OnEndReachedHelperProps } from './onEndReachedHelper.types';
import { ViewabilityConfigTuplesProps } from './viewable.types';
import { OnRecyclerProcess, RecyclerProps } from '@x-oasis/recycler';
import { ReducerResult, Store, ActionType } from '../state/types';

export type SpaceStateTokenPosition = 'before' | 'buffered' | 'after';

export type SpaceStateToken<ItemT> = {
  item: ItemT;
  key: string;
  length: number;
  isSpace: boolean;
  isSticky: boolean;
  isReserved: boolean;
  itemMeta: ItemMeta;
  position: SpaceStateTokenPosition;
};

export type RecycleStateToken<ItemT> = {
  targetKey: string;
  targetIndex: number;
  offset: number;
} & SpaceStateToken<ItemT>;

export type SpaceStateResult<ItemT> = Array<SpaceStateToken<ItemT>>;
export type RecycleState<ItemT> = Array<RecycleStateToken<ItemT>>;

export type RecycleStateResult<ItemT> = {
  spaceState: SpaceStateResult<ItemT>;
  recycleState: RecycleState<ItemT>;
};

export type ListStateResult<ItemT> =
  | SpaceStateResult<ItemT>
  | RecycleStateResult<ItemT>;

export type StateListener<ItemT = {}> = (
  newState: ListStateResult<ItemT>,
  oldState: ListStateResult<ItemT>
) => void;

// export type ListBaseDimensionsProvider = ListGroupDimensions | ListDimensions;
export type ListBaseDimensionsStore = Store<ReducerResult>;

export interface ListBaseDimensionsProps
  extends BaseLayoutProps,
    RecyclerProps,
    OnEndReachedHelperProps,
    ViewabilityConfigTuplesProps {
  releaseSpaceStateItem?: boolean;
  store?: ListBaseDimensionsStore;
  dispatchMetricsThreshold?: number;
  useItemApproximateLength?: boolean;
  itemApproximateLength?: number;
  onRecyclerProcess?: OnRecyclerProcess;
  stillnessThreshold?: number;
}

export type PreStateResult = {
  visibleStartIndex: number;
  visibleEndIndex: number;
  bufferedStartIndex: number;
  bufferedEndIndex: number;
  isEndReached: boolean;
  distanceFromEnd: number;
  actionType: ActionType;
};

export type ListState<ItemT extends {} = {}> = {
  // data: Array<ItemT>;
} & PreStateResult;
