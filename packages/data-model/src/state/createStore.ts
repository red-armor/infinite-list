import ListDimensions from '../ListDimensions';
import { ScrollMetrics } from '../types';
import { resolveAction } from './actions';
import reducer from './reducer';
import { Reducer, ReducerResult } from './types';

function createStore<State extends ReducerResult = ReducerResult>(
  _reducer: Reducer<State> = reducer
) {
  let currentState: State = {} as any as State;
  let currentReducer = _reducer;

  const dispatch = (action) => {
    currentState = currentReducer(currentState, action);
    return currentState;
  };

  const dispatchMetrics = (props: {
    dimension: ListDimensions;
    scrollMetrics: ScrollMetrics;
  }) => {
    const action = resolveAction(currentState, props);
    if (action) return dispatch(action);
    return currentState;
  };

  const getState = () => currentState;
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
