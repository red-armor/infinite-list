import ListDimensions from '../ListDimensions';
import { INVALID_LENGTH } from '../common';
import { ScrollMetrics } from '../types';
import { Action, ActionType, ReducerResult } from './types';

export const resolveAction = <State extends ReducerResult = ReducerResult>(
  state: State,
  props: {
    scrollMetrics: ScrollMetrics;
    dimension: ListDimensions;
  }
): Action | null => {
  const { scrollMetrics, dimension } = props;
  const { velocity } = scrollMetrics;

  const _info = dimension.getOnEndReachedHelper().perform(scrollMetrics);

  let isEndReached = _info.isEndReached;
  const distanceFromEnd = _info.distanceFromEnd;

  if (!isEndReached) {
    const { visibleEndIndex, visibleStartIndex } = state;
    const total = dimension.getTotalLength();
    if (
      (visibleStartIndex !== -1 || visibleEndIndex !== -1) &&
      total !== INVALID_LENGTH &&
      dimension.hasUnLayoutItems()
    ) {
      isEndReached = dimension.getOnEndReachedHelper().perform({
        ...scrollMetrics,
        contentLength: dimension.getContainerOffset() + total,
      }).isEndReached;
    }
  }

  if (isEndReached) {
    return {
      type: ActionType.HydrationWithBatchUpdate,
      payload: {
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
      },
    };
  }

  if (velocity < 0) {
    return {
      type: ActionType.ScrollUp,
      payload: {
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
    },
  };
};
