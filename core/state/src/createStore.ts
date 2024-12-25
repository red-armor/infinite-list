// import ListDimensions from '../ListDimensions';
// import ListGroupDimensions from '../ListGroupDimensions';

import { IListDimensions, IListGroupDimensions } from '@infinite-list/types';
import { ScrollMetrics } from './types';
import { resolveAction } from './actions';
import reducer from './reducer';
import { Action, ActionType, Enhancer, ReducerResult } from './types/types';

function createStore<State extends ReducerResult = ReducerResult>(
  enhancer: Enhancer<State>
  // _reducer: EnhancedReducer<State> = reducer
) {
  let currentState: State = {
    visibleStartIndex: -1,
    visibleEndIndex: -1,
    bufferedStartIndex: -1,
    bufferedEndIndex: -1,
    isEndReached: false,
    distanceFromEnd: 0,
    actionType: ActionType.Initial,
  } as any as State;

  const getState = () => currentState;

  const storeContext = {
    dataLength: 0,
    getState,
  };
  const currentReducer = reducer(enhancer);

  const dispatch = (action: Action) => {
    currentState = currentReducer(currentState, action);
    return currentState;
  };

  const dispatchMetrics = (props: {
    dimension: IListDimensions | IListGroupDimensions;
    scrollMetrics: ScrollMetrics;
  }) => {
    const action = resolveAction<State>(currentState, props, storeContext);
    if (action) {
      currentState = dispatch(action);
      return currentState;
    }
    return currentState;
  };

  const setState = (state: State) => {
    currentState = state;
  };

  return {
    dispatch,
    getState,
    setState,
    dispatchMetrics,
  };
}

export default createStore;
