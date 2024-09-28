import ListDimensions from '../ListDimensions';
import { INVALID_LENGTH } from '../common';
import { ScrollMetrics } from '../types';
import { Action, ActionType, ReducerResult } from './types';

export const resolveAction = <State extends ReducerResult = ReducerResult>(
  state: State,
  props: {
    scrollMetrics: ScrollMetrics;
    dimension: ListDimensions;
  },
  ctx: {
    dataLength: number;
  }
): Action | null => {
  const { scrollMetrics, dimension } = props;
  const { velocity = 0 } = scrollMetrics;

  const _info = dimension.getOnEndReachedHelper()?.perform(scrollMetrics);
  const isEndReached = _info?.isEndReached;
  const prevDataLength = ctx.dataLength;
  const nextDataLength = dimension.getDataLength();

  // isEndReached should not be rewrite, or trigger onEndReached...
  let nextIsEndReached = isEndReached;
  const distanceFromEnd = _info?.distanceFromEnd;

  if (!nextIsEndReached) {
    const { visibleEndIndex, visibleStartIndex } = state;
    const total = dimension.getTotalLength();
    if (
      (visibleStartIndex !== -1 || visibleEndIndex !== -1) &&
      (total as any as string) !== INVALID_LENGTH &&
      dimension.hasUnLayoutItems()
    ) {
      const _containerOffset = dimension.getContainerOffset();
      const containerOffset =
        typeof _containerOffset === 'number' ? _containerOffset : 0;
      nextIsEndReached = dimension.getOnEndReachedHelper().perform({
        ...scrollMetrics,
        contentLength: containerOffset + total,
      }).isEndReached;
    }
  }

  ctx.dataLength = nextDataLength;

  if (!prevDataLength && nextDataLength) {
    return {
      type: ActionType.Initial,
      payload: {
        dimension,
        scrollMetrics,
        isEndReached,
        distanceFromEnd,
      },
    };
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
