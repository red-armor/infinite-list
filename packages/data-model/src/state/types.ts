import ListDimensions from '../ListDimensions';
import ListGroupDimensions from '../ListGroupDimensions';
import { ScrollMetrics } from '../types';

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
  dimension: ListDimensions | ListGroupDimensions;
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

export type Action = {
  type: ActionType; // 应用触底了，但是List仍旧有数据没有渲染
  payload: ActionPayload;
};

export type Reducer<State> = (state: State, action: Action) => State;

type Dispatch<State> = (action: Action) => State;
type DispatchMetrics<State> = (props: {
  dimension: ListDimensions | ListGroupDimensions;
  scrollMetrics: ScrollMetrics;
}) => State;

export type Store<State> = {
  dispatch: Dispatch<State>;
  dispatchMetrics: DispatchMetrics<State>;
  getState: () => State;
  setState: (state: State) => void;
};

export type CreateStore = <State>(reducer?: Reducer<State>) => Store<State>;

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
