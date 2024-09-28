import ItemMeta from '../ItemMeta';
import { BaseLayoutProps } from './BaseLayout.types';
import { OnEndReachedHelperProps } from './onEndReachedHelper.types';
import { ViewabilityConfigTuplesProps } from './viewable.types';
import { OnRecyclerProcess, RecyclerProps } from '@x-oasis/recycler';
import { ReducerResult, Store, ActionType } from '../state/types';
import { GenericItemT } from './generic.types';

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
export type RecycleRecycleState<ItemT extends GenericItemT = GenericItemT> =
  Array<RecycleStateToken<ItemT>>;

export type RecycleStateResult<ItemT extends GenericItemT = GenericItemT> = {
  rangeState: ListState;
  spaceState: SpaceStateResult<ItemT>;
  recycleState: RecycleRecycleState<ItemT>;
};

export type ListStateResult<ItemT extends GenericItemT = GenericItemT> =
  | SpaceStateResult<ItemT>
  | RecycleStateResult<ItemT>;

export type StateListener<ItemT extends GenericItemT = GenericItemT> = (
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
  store: ListBaseDimensionsStore;
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

export type ListState = {
  // data: Array<ItemT>;
} & PreStateResult;
