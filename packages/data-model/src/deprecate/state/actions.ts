import ListDimensions from '../ListDimensions';
import { INVALID_LENGTH } from '../../common';
import { ScrollMetrics } from '../types';
import { Action, ActionType, ReducerResult } from './types';

// const resolvePseudoVelocity = (velocity: number) => {
//   if (velocity > 0) return 1;
//   if (velocity < 0) return -1;
//   return 0;
// };

export const resolveAction = <State extends ReducerResult = ReducerResult>(
  state: State,
  props: {
    scrollMetrics: ScrollMetrics;
    dimension: ListDimensions;
  }
): Action | null => {
  const { scrollMetrics, dimension } = props;
  const { velocity } = scrollMetrics;
  // const pseudoVelocity = resolvePseudoVelocity(velocity);

  const _info = dimension.getOnEndReachedHelper().perform(scrollMetrics);
  const isEndReached = _info.isEndReached;

  // isEndReached should not be rewrite, or trigger onEndReached...
  let nextIsEndReached = isEndReached;
  const distanceFromEnd = _info.distanceFromEnd;

  if (!nextIsEndReached) {
    const { visibleEndIndex, visibleStartIndex } = state;
    const total = dimension.getTotalLength();
    if (
      (visibleStartIndex !== -1 || visibleEndIndex !== -1) &&
      total !== INVALID_LENGTH &&
      dimension.hasUnLayoutItems()
    ) {
      nextIsEndReached = dimension.getOnEndReachedHelper().perform({
        ...scrollMetrics,
        contentLength: dimension.getContainerOffset() + total,
      }).isEndReached;
    }
  }

  if (nextIsEndReached) {
    return {
      type: ActionType.HydrationWithBatchUpdate,
      payload: {
        // pseudoVelocity,
        dimension,
        scrollMetrics,
        isEndReached,
        distanceFromEnd,
      },
    };
  }

  if (velocity > 0) {
    return {
      type: ActionType.ScrollDown,
      payload: {
        dimension,
        scrollMetrics,
        isEndReached,
        distanceFromEnd,
        // pseudoVelocity,
      },
    };
  }

  if (velocity < 0) {
    return {
      type: ActionType.ScrollUp,
      payload: {
        // pseudoVelocity,
        dimension,
        scrollMetrics,
        isEndReached,
        distanceFromEnd,
      },
    };
  }

  // 主要是解决，当动态删除item时，重新计算buffer逻辑
  return {
    type: ActionType.Recalculate,
    payload: {
      dimension,
      scrollMetrics,
      isEndReached,
      distanceFromEnd,
      // pseudoVelocity,
    },
  };
};
