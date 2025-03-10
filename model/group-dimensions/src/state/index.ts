import { ReducerResult } from '@infinite-list/state';
import { createStore as _createStore } from '@infinite-list/state';
import fixBufferedRange from './middleware/fixBufferedRange';
import fixInitialBufferedRange from './middleware/fixInitialBufferedRange';
import fixVisibleRange from './middleware/fixVisibleRange';

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
