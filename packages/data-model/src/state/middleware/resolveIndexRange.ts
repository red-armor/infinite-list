import { ActionPayload, Ctx, ReducerResult } from '../types';
import { info } from '../../utils/logger';

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
    Math.min(offset + visibleLength * (bufferSize + 1), contentLength)
  );

  const { minOffset: visibleMinOffset, maxOffset: visibleMaxOffset } =
    dimension.resolveOffsetRange(offset, offset + visibleLength);

  const visibleIndexRange = dimension.computeIndexRange(
    visibleMinOffset,
    visibleMaxOffset
  );

  const bufferedIndexRange = dimension.computeIndexRange(
    minOffset,
    Math.min(maxOffset, contentLength)
  );

  info('scrollMetrics info ', {
    minOffset: offset,
    maxOffset: offset + visibleLength,
  });
  info('visibleRange ', { visibleMinOffset, visibleMaxOffset });
  info('visibleIndexRange ', visibleIndexRange);
  info('bufferedRange ', {
    bufferedMinOffset: minOffset,
    bufferedMaxOffset: Math.min(maxOffset, contentLength),
  });
  info('bufferedIndexRange ', bufferedIndexRange);

  if (visibleIndexRange) ctx.visibleIndexRange = visibleIndexRange;
  if (bufferedIndexRange) ctx.bufferedIndexRange = bufferedIndexRange;
};
