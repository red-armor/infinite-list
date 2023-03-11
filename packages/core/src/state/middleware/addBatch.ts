import Dimension from '../../Dimension';
import ListGroupDimensions from '../../ListGroupDimensions';
import { ActionPayload, Ctx, ReducerResult } from '../types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { dimension, scrollMetrics, distanceFromEnd = 0 } = payload;
  const { visibleIndexRange, bufferedIndexRange, maxIndex } = ctx;

  const maxToRenderPerBatch = dimension.maxToRenderPerBatch;

  let _nextBufferedEndIndex = bufferedIndexRange.endIndex + maxToRenderPerBatch;

  let startCount = false;
  const { visibleLength } = scrollMetrics;
  let len = visibleLength + distanceFromEnd;

  if (dimension instanceof ListGroupDimensions) {
    let count = 0;
    for (
      let startIndex = visibleIndexRange.startIndex;
      startIndex <= maxIndex;
      startIndex++
    ) {
      const dimensionsInfo = dimension.getFinalIndexInfo(startIndex);
      if (!dimensionsInfo) continue;
      const { dimensions: currentDimensions, index: currentIndex } =
        dimensionsInfo;

      if (currentDimensions instanceof Dimension) {
        // ignore `ignoredToPerBatch` item
        if (currentDimensions?.getIgnoredToPerBatch()) {
          continue;
        }
      }

      const meta = currentDimensions.getIndexItemMeta(currentIndex);

      if (!startCount && meta && meta.getLayout()) {
        len -= currentDimensions
          .getSelectValue()
          .selectLength(meta.getLayout());

        if (len > 0) continue;
        else {
          startCount = true;
          continue;
        }
      } else {
        startCount = true;
      }

      count++;

      if (count >= maxToRenderPerBatch) {
        _nextBufferedEndIndex = startIndex;
        break;
      }
    }
  }

  ctx.bufferedIndexRange.endIndex = _nextBufferedEndIndex;

  const maxVisibleEndIndex = Math.min(
    ctx.visibleIndexRange.endIndex,
    _nextBufferedEndIndex
  );

  ctx.visibleIndexRange.endIndex = maxVisibleEndIndex;

  // ctx.visibleIndexRange.endIndex = state?.visibleEndIndex
  //   ? Math.min(state.visibleEndIndex, maxVisibleEndIndex)
  //   : maxVisibleEndIndex;
};
