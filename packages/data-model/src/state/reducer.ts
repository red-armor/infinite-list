import addBatch from './middleware/addBatch';
import bufferedEndIndexShouldBeReserved from './middleware/bufferedEndIndexShouldBeReserved';
import bufferedStartIndexShouldBeReserved from './middleware/bufferedStartIndexShouldBeReserved';
import hydrateOnEndReached from './middleware/hydrateOnEndReached';
import makeIndexMeaningful from './middleware/makeIndexMeaningful';
import resolveIndexRange from './middleware/resolveIndexRange';
import resolveMaxIndex from './middleware/resolveMaxIndex';
import resolveUnLayoutLimitation from './middleware/resolveUnLayoutLimitation';
import preCheck from './middleware/preCheck';
import { Action, ActionPayload, Ctx, ReducerResult } from './types';

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
  bufferedEndIndexShouldBeReserved(state, payload, ctx);

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
  bufferedEndIndexShouldBeReserved(state, payload, ctx);

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
  bufferedEndIndexShouldBeReserved(state, payload, ctx);

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
  bufferedStartIndexShouldBeReserved(state, payload, ctx);

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
    case 'hydrationWithBatchUpdate':
      return hydrationWithBatchUpdate(state, payload);
    case 'scrollDown':
      return scrollDown(state, payload);
    case 'scrollUp':
      return scrollUp(state, payload);
    case 'recalculate':
      return recalculate(state, payload);
  }
};
