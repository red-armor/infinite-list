import Dimension from '../../Dimension';
import ListGroupDimensions from '../../ListGroupDimensions';
import { ActionPayload, Ctx, ReducerResult } from '../types';
import { isValidMetaLayout } from '../../ItemMeta';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { dimension } = payload;
  const { visibleIndexRange, bufferedIndexRange, maxIndex } = ctx;

  const maxToRenderPerBatch = dimension.maxToRenderPerBatch;

  let _nextBufferedEndIndex = bufferedIndexRange.endIndex + maxToRenderPerBatch;

  if (dimension instanceof ListGroupDimensions) {
    let count = 0;
    for (
      let startIndex = visibleIndexRange.startIndex;
      startIndex <= maxIndex;
      startIndex++
    ) {
      const dimensionsInfo = dimension.getFinalIndexIndexInfo(startIndex);
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

      if (!isValidMetaLayout(meta)) { count++ }

      if (count >= maxToRenderPerBatch) {
        _nextBufferedEndIndex = startIndex;
        break;
      }
    }
  }

  ctx.bufferedIndexRange.endIndex = _nextBufferedEndIndex;

  ctx.visibleIndexRange.endIndex = Math.min(
    ctx.visibleIndexRange.endIndex,
    _nextBufferedEndIndex
  );;
};
