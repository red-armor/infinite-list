import Dimension from '../../Dimension';
import ListDimensions from '../../ListDimensions';
import ListGroupDimensions from '../../ListGroupDimensions';
import { ActionPayload, Ctx, ReducerResult } from '../types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { dimension } = payload;

  const { visibleIndexRange, bufferedIndexRange, maxIndex } = ctx;

  const maxToRenderPerBatch = dimension.maxToRenderPerBatch;
  let _nextBufferedEndIndex = bufferedIndexRange.endIndex;

  if (dimension instanceof ListGroupDimensions) {
    let count = 0;
    for (
      let startIndex = visibleIndexRange.startIndex;
      startIndex <= Math.min(_nextBufferedEndIndex, maxIndex);
      startIndex++
    ) {
      const dimensionInfo = dimension.getFinalIndexInfo(startIndex);
      const currentDimension = dimensionInfo?.dimensions;

      if (currentDimension instanceof Dimension) {
        if (currentDimension?.getIgnoredToPerBatch()) continue;
        const meta = currentDimension.getMeta();
        if (!meta.getLayout()) count++;
      }

      if (currentDimension instanceof ListDimensions) {
        const meta = currentDimension.getIndexItemMeta(dimensionInfo.index);
        if (!meta.getLayout()) count++;
      }

      if (count >= maxToRenderPerBatch) {
        _nextBufferedEndIndex = startIndex;
        break;
      }
    }
  }

  if (dimension instanceof ListDimensions) {
    let count = 0;
    for (
      let startIndex = visibleIndexRange.startIndex;
      startIndex <= Math.min(_nextBufferedEndIndex, maxIndex);
      startIndex++
    ) {
      const meta = dimension.getIndexItemMeta(startIndex);
      if (!meta) continue;
      if (!meta.getLayout()) count++;

      if (count >= maxToRenderPerBatch) {
        _nextBufferedEndIndex = startIndex;
        break;
      }
    }
  }

  ctx.bufferedIndexRange.endIndex = _nextBufferedEndIndex;
};
