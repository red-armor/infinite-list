import ListDimensions from '../ListDimensions';
import ListGroupDimensions from '../ListGroupDimensions';
import { ScrollMetrics } from '../types';
import { resolveAction } from './actions';
import reducer from './reducer';
import { Action, ActionType, Reducer, ReducerResult } from './types';

function createStore<State extends ReducerResult = ReducerResult>(
  _reducer: Reducer<State> = reducer
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
  const currentReducer = _reducer;

  const dispatch = (action: Action) => {
    currentState = currentReducer(currentState, action);
    return currentState;
  };

  const dispatchMetrics = (props: {
    dimension: ListDimensions | ListGroupDimensions;
    scrollMetrics: ScrollMetrics;
  }) => {
    const action = resolveAction(currentState, props, storeContext);
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
