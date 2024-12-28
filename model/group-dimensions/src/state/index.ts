import { ReducerResult } from '@infinite-list/state';

import fixVisibleRange from './middleware/fixVisibleRange';
import fixInitialBufferedRange from './middleware/fixInitialBufferedRange';
import fixBufferedRange from './middleware/fixBufferedRange';

import { createStore as _createStore } from '@infinite-list/state';

export function createStore<State extends ReducerResult = ReducerResult>() {
  return _createStore<State>({
    initial: (middleware, applyMiddleware) => {
      const { resolveIndexRange, hydrateOnEndReached, resolveInitialState } =
        middleware;

      applyMiddleware([
        resolveIndexRange,
        hydrateOnEndReached,
        fixVisibleRange,
        fixInitialBufferedRange,
        resolveInitialState,
      ]);
    },
    hydrationWithBatchUpdate: (middleware, applyMiddleware) => {
      const {
        preCheck,
        resolveIndexRange,
        hydrateOnEndReached,
        resolveMaxIndex,
        makeIndexMeaningful,
      } = middleware;

      applyMiddleware([
        preCheck,
        resolveIndexRange,
        hydrateOnEndReached,
        resolveMaxIndex,
        fixBufferedRange,
        fixVisibleRange,
        makeIndexMeaningful,
      ]);
    },
    recalculate: (middleware, applyMiddleware) => {
      const {
        preCheck,
        resolveIndexRange,
        hydrateOnEndReached,
        resolveMaxIndex,
        makeIndexMeaningful,
      } = middleware;

      applyMiddleware([
        preCheck,
        resolveIndexRange,
        hydrateOnEndReached,
        resolveMaxIndex,
        fixBufferedRange,
        fixVisibleRange,
        makeIndexMeaningful,
      ]);
    },
    scrollDown: (middleware, applyMiddleware) => {
      const {
        preCheck,
        resolveIndexRange,
        hydrateOnEndReached,
        resolveMaxIndex,
        makeIndexMeaningful,
      } = middleware;

      applyMiddleware([
        preCheck,
        resolveIndexRange,
        hydrateOnEndReached,
        resolveMaxIndex,
        fixBufferedRange,
        fixVisibleRange,
        makeIndexMeaningful,
      ]);
    },
    scrollUp: (middleware, applyMiddleware) => {
      const {
        preCheck,
        resolveIndexRange,
        hydrateOnEndReached,
        resolveMaxIndex,
        makeIndexMeaningful,
      } = middleware;

      applyMiddleware([
        preCheck,
        resolveIndexRange,
        hydrateOnEndReached,
        resolveMaxIndex,
        fixBufferedRange,
        fixVisibleRange,
        makeIndexMeaningful,
      ]);
    },
  });
}
