import { ActionPayload, Ctx, ReducerResult } from '@infinite-list/state';
import { isValidMetaLayout } from '@infinite-list/item-meta';
import { log } from '@infinite-list/utils';

// recalculate buffer
export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { dimension } = payload;

  const { visibleIndexRange, bufferedIndexRange, maxIndex } = ctx;

  const initialNumToRender = dimension.initialNumToRender;

  const { startIndex, endIndex } = visibleIndexRange;

  if (endIndex - startIndex >= initialNumToRender) {
    ctx.bufferedIndexRange.startIndex = startIndex;
    ctx.bufferedIndexRange.endIndex = endIndex;
    return;
  }

  // on initial, maxToRenderPerBatch should be the minimum
  const maxToRenderPerBatch =
    initialNumToRender > 0
      ? Math.min(dimension.maxToRenderPerBatch, initialNumToRender)
      : dimension.maxToRenderPerBatch;
  let _nextBufferedEndIndex = bufferedIndexRange.endIndex;

  let count = 0;
  for (
    let startIndex = visibleIndexRange.startIndex;
    startIndex <= Math.min(_nextBufferedEndIndex, maxIndex);
    startIndex++
  ) {
    const meta = dimension.getIndexItemMeta(startIndex);
    if (!meta) continue;
    if (!isValidMetaLayout(meta)) count++;

    if (count >= maxToRenderPerBatch) {
      _nextBufferedEndIndex = startIndex;
      break;
    }
    // }
    log.info('fixInitialBufferedRange ', _nextBufferedEndIndex);
    ctx.bufferedIndexRange.endIndex = _nextBufferedEndIndex;
  }
};
