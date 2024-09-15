import preCheck from './middleware/preCheck';
import addBatch from './middleware/addBatch';
import hydrateOnEndReached from './middleware/hydrateOnEndReached';
import makeIndexMeaningful from './middleware/makeIndexMeaningful';
import resolveIndexRange from './middleware/resolveIndexRange';
import resolveMaxIndex from './middleware/resolveMaxIndex';
import resolveUnLayoutLimitation from './middleware/resolveUnLayoutLimitation';
import { Action, ActionPayload, ActionType, Ctx, ReducerResult } from './types';

const hydrationWithBatchUpdate = <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload
): State => {
  const ctx = {} as Ctx;
  preCheck(state, payload, ctx);
  resolveIndexRange(state, payload, ctx);

  hydrateOnEndReached(state, payload, ctx);
  resolveMaxIndex(state, payload, ctx);
  addBatch(state, payload, ctx);
  resolveUnLayoutLimitation(state, payload, ctx);

  // should be the last
  makeIndexMeaningful(state, payload, ctx);

  const {
    visibleIndexRange,
    bufferedIndexRange,
    maxIndex,
    isEndReached,
    distanceFromEnd,
  } = ctx;

  return {
    ...state,
    isEndReached,
    distanceFromEnd,
    // pseudoVelocity: payload.pseudoVelocity,
    actionType: 'hydrationWithBatchUpdate',
    visibleStartIndex: visibleIndexRange.startIndex,
    visibleEndIndex: Math.min(visibleIndexRange.endIndex, maxIndex),
    bufferedStartIndex: bufferedIndexRange.startIndex,
    // @ts-ignore
    bufferedEndIndex: bufferedIndexRange.endIndex,
  };
};

const recalculate = <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload
): State => {
  const ctx = {} as Ctx;
  preCheck(state, payload, ctx);
  resolveIndexRange(state, payload, ctx);

  hydrateOnEndReached(state, payload, ctx);
  resolveMaxIndex(state, payload, ctx);
  resolveUnLayoutLimitation(state, payload, ctx);

  // should be the last
  makeIndexMeaningful(state, payload, ctx);

  const {
    visibleIndexRange,
    bufferedIndexRange,
    maxIndex,
    isEndReached,
    distanceFromEnd,
  } = ctx;

  return {
    ...state,
    isEndReached,
    distanceFromEnd,
    // pseudoVelocity: payload.pseudoVelocity,
    actionType: 'recalculate',
    visibleStartIndex: visibleIndexRange.startIndex,
    visibleEndIndex: Math.min(visibleIndexRange.endIndex, maxIndex),
    bufferedStartIndex: bufferedIndexRange.startIndex,
    // @ts-ignore
    bufferedEndIndex: bufferedIndexRange.endIndex,
  };
};

const scrollDown = <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload
): State => {
  const ctx = {} as Ctx;
  preCheck(state, payload, ctx);
  resolveIndexRange(state, payload, ctx);

  hydrateOnEndReached(state, payload, ctx);
  resolveMaxIndex(state, payload, ctx);
  resolveUnLayoutLimitation(state, payload, ctx);

  // should be the last
  makeIndexMeaningful(state, payload, ctx);

  const {
    visibleIndexRange,
    bufferedIndexRange,
    maxIndex,
    isEndReached,
    distanceFromEnd,
  } = ctx;

  return {
    ...state,
    actionType: 'scrollDown',
    isEndReached,
    distanceFromEnd,
    // pseudoVelocity: payload.pseudoVelocity,
    visibleStartIndex: visibleIndexRange.startIndex,
    visibleEndIndex: Math.min(visibleIndexRange.endIndex, maxIndex),
    bufferedStartIndex: bufferedIndexRange.startIndex,
    // @ts-ignore
    bufferedEndIndex: bufferedIndexRange.endIndex,
  };
};

const scrollUp = <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload
): State => {
  const ctx = {} as Ctx;
  preCheck(state, payload, ctx);
  resolveIndexRange(state, payload, ctx);

  hydrateOnEndReached(state, payload, ctx);
  resolveMaxIndex(state, payload, ctx);
  resolveUnLayoutLimitation(state, payload, ctx);
  // bufferedStartIndexShouldBeReserved(state, payload, ctx);

  // should be the last
  makeIndexMeaningful(state, payload, ctx);

  const {
    visibleIndexRange,
    bufferedIndexRange,
    maxIndex,
    isEndReached,
    distanceFromEnd,
  } = ctx;

  return {
    ...state,
    isEndReached,
    distanceFromEnd,
    actionType: 'scrollUp',
    // pseudoVelocity: payload.pseudoVelocity,
    visibleStartIndex: visibleIndexRange.startIndex,
    visibleEndIndex: Math.min(visibleIndexRange.endIndex, maxIndex),
    // @ts-ignore
    bufferedStartIndex: bufferedIndexRange.startIndex,
    bufferedEndIndex: Math.min(bufferedIndexRange.endIndex, maxIndex),
  };
};

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  action: Action
) => {
  const { type, payload } = action;
  switch (type) {
    case ActionType.HydrationWithBatchUpdate:
      return hydrationWithBatchUpdate(state, payload);
    case ActionType.ScrollDown:
      return scrollDown(state, payload);
    case ActionType.ScrollUp:
      return scrollUp(state, payload);
    case ActionType.Initial:
    case ActionType.Recalculate:
      return recalculate(state, payload);
  }
};
