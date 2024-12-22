import { ActionPayload, Ctx, ReducerResult } from '../types';
import { log } from '@infinite-list/utils';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { dimension, scrollMetrics } = payload;
  const { contentLength, offset, visibleLength = 0 } = scrollMetrics;

  const bufferSize = dimension.getBufferSize();
  const { minOffset, maxOffset } = dimension.resolveOffsetRange(
    Math.max(offset - visibleLength * bufferSize, 0),
    // should less than content length

    // for buffered max and min, only if contentLength is greater than 0,
    // it should be in consider
    contentLength
      ? Math.min(offset + visibleLength * (bufferSize + 1), contentLength)
      : offset + visibleLength * (bufferSize + 1)
  );

  const { minOffset: visibleMinOffset, maxOffset: visibleMaxOffset } =
    dimension.resolveOffsetRange(offset, offset + visibleLength);

  const visibleIndexRange = dimension.computeIndexRange(
    visibleMinOffset,
    visibleMaxOffset
  );

  const bufferedIndexRange = dimension.computeIndexRange(
    minOffset,
    contentLength ? Math.min(maxOffset, contentLength) : maxOffset
  );

  log.info('scrollMetrics info ', {
    minOffset: offset,
    maxOffset: offset + visibleLength,
  });
  log.info('visibleRange ', { visibleMinOffset, visibleMaxOffset });
  log.info('visibleIndexRange ', visibleIndexRange);
  log.info('bufferedRange ', {
    bufferedMinOffset: minOffset,
    bufferedMaxOffset: Math.min(maxOffset, contentLength),
  });
  log.info('bufferedIndexRange ', bufferedIndexRange);

  if (visibleIndexRange) ctx.visibleIndexRange = visibleIndexRange;
  if (bufferedIndexRange) ctx.bufferedIndexRange = bufferedIndexRange;
};
