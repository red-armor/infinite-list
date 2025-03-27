// import ListDimensions from '../ListDimensions';
// import ListGroupDimensions from '../ListGroupDimensions';
import type {
  IListDimensions,
  IListGroupDimensions,
} from '@infinite-list/types';
import type { ScrollMetrics } from './scrollMetrics.types';

export type ReducerResult = {
  visibleStartIndex: number;
  visibleEndIndex: number;
  bufferedStartIndex: number;
  bufferedEndIndex: number;
  isEndReached: boolean;
  distanceFromEnd: number;
  actionType: ActionType;
};

export type ActionPayload = {
  dimension: IListDimensions | IListGroupDimensions;
  scrollMetrics: ScrollMetrics;
  isEndReached: boolean;
  distanceFromEnd: number;
};

export enum ActionType {
  HydrationWithBatchUpdate = 'hydrationWithBatchUpdate',
  ScrollDown = 'scrollDown',
  ScrollUp = 'scrollUp',
  Recalculate = 'recalculate',
  Initial = 'initial',
}

export type RawAction = {
  type: ActionType; // 应用触底了，但是List仍旧有数据没有渲染
  payload: {
    dimension: IListDimensions | IListGroupDimensions;
    scrollMetrics: ScrollMetrics;
  };
};

export type Action = {
  type: ActionType; // 应用触底了，但是List仍旧有数据没有渲染
  payload: ActionPayload;
};

export type Reducer<State> = (state: State, action: Action) => State;

type Dispatch<State> = (action: Action) => State;
type DispatchMetrics<State> = (props: {
  dimension: IListDimensions | IListGroupDimensions;
  scrollMetrics: ScrollMetrics;
}) => State;

export type Store<State> = {
  dispatch: Dispatch<State>;
  dispatchMetrics: DispatchMetrics<State>;
  getState: () => State;
  setState: (state: State) => void;
};

export type CreateStore<State extends ReducerResult = ReducerResult> = (
  reducer?: Reducer<State> | Enhancer<State>
) => Store<State>;

export type EnhancedReducer<State extends ReducerResult = ReducerResult> = (
  enhancer?: Enhancer<State>
) => (state: State, action: Action) => void;

export type Ctx = {
  maxIndex: number;
  visibleIndexRange: {
    startIndex: number;
    endIndex: number;
  };
  bufferedIndexRange: {
    startIndex: number;
    endIndex: number;
  };
  isEndReached: boolean;
  distanceFromEnd: number;
};

export type ReducerAtom<State extends ReducerResult = ReducerResult> = (
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => void;

export type ApplyMiddleware<State extends ReducerResult = ReducerResult> = (
  middlewares: ReducerAtom<State>[]
) => void;

export type HydrationWithBatchUpdate<
  State extends ReducerResult = ReducerResult,
> = (
  reducers: {
    preCheck: ReducerAtom<State>;
    resolveIndexRange: ReducerAtom<State>;
    hydrateOnEndReached: ReducerAtom<State>;
    resolveMaxIndex: ReducerAtom<State>;
    makeIndexMeaningful: ReducerAtom<State>;
  },
  applyMiddleware: ApplyMiddleware<State>
) => void;
export type Initial<State extends ReducerResult = ReducerResult> = (
  reducers: {
    resolveIndexRange: ReducerAtom<State>;
    hydrateOnEndReached: ReducerAtom<State>;
    resolveInitialState: ReducerAtom<State>;
  },
  applyMiddleware: ApplyMiddleware<State>
) => void;
export type Recalculate<State extends ReducerResult = ReducerResult> = (
  reducers: {
    preCheck: ReducerAtom<State>;
    resolveIndexRange: ReducerAtom<State>;
    hydrateOnEndReached: ReducerAtom<State>;
    resolveMaxIndex: ReducerAtom<State>;
    makeIndexMeaningful: ReducerAtom<State>;
  },
  applyMiddleware: ApplyMiddleware<State>
) => void;
export type ScrollDown<State extends ReducerResult = ReducerResult> = (
  reducers: {
    preCheck: ReducerAtom<State>;
    resolveIndexRange: ReducerAtom<State>;
    hydrateOnEndReached: ReducerAtom<State>;
    resolveMaxIndex: ReducerAtom<State>;
    makeIndexMeaningful: ReducerAtom<State>;
  },
  applyMiddleware: ApplyMiddleware<State>
) => void;
export type ScrollUp<State extends ReducerResult = ReducerResult> = (
  reducers: {
    preCheck: ReducerAtom<State>;
    resolveIndexRange: ReducerAtom<State>;
    hydrateOnEndReached: ReducerAtom<State>;
    resolveMaxIndex: ReducerAtom<State>;
    makeIndexMeaningful: ReducerAtom<State>;
  },
  applyMiddleware: ApplyMiddleware<State>
) => void;

export type Enhancer<State extends ReducerResult = ReducerResult> = {
  [ActionType.Initial]?: Initial<State>;
  [ActionType.HydrationWithBatchUpdate]?: HydrationWithBatchUpdate<State>;
  [ActionType.Recalculate]?: Recalculate<State>;
  [ActionType.ScrollDown]?: ScrollDown<State>;
  [ActionType.ScrollUp]?: ScrollUp<State>;
};
