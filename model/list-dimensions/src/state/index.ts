import fixVisibleRange from './middleware/fixVisibleRange';
import fixInitialBufferedRange from './middleware/fixInitialBufferedRange';

import { createStore as _createStore } from '@infinite-list/state';

export function createStore() {
  _createStore({
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
  });
}
