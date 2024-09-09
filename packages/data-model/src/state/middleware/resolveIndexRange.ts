import { ActionPayload, Ctx, ReducerResult } from '../types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { dimension, scrollMetrics } = payload;
  const { contentLength, offset, visibleLength } = scrollMetrics;
  const bufferSize = dimension.getBufferSize();
  const { minOffset, maxOffset } = dimension.resolveOffsetRange(
    Math.max(offset - visibleLength * bufferSize, 0),
    offset + visibleLength * (bufferSize + 1)
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

  console.log(
    'buffer =---',
    visibleMinOffset,
    visibleMaxOffset,
    visibleIndexRange,
    bufferedIndexRange
  );

  if (visibleIndexRange) ctx.visibleIndexRange = visibleIndexRange;
  if (bufferedIndexRange) ctx.bufferedIndexRange = bufferedIndexRange;
};
