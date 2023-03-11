import { ActionPayload, Ctx, ReducerResult } from '../types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { maxIndex, bufferedIndexRange } = ctx;

  // @ts-ignore
  bufferedIndexRange.endIndex = state.bufferedEndIndex
    ? Math.min(
        Math.max(bufferedIndexRange.endIndex, state.bufferedEndIndex),
        // @ts-ignore；如果有bufferedEndIndex，下一个值一定不能比它小，否则出现渲染浪费了
        maxIndex
      )
    : Math.min(bufferedIndexRange.endIndex, maxIndex);
  // // @ts-ignore
  // bufferedIndexRange.endIndex = state.bufferedEndIndex
  //   ? Math.max(
  //       Math.min(bufferedIndexRange.endIndex, maxIndex),
  //       // @ts-ignore；如果有bufferedEndIndex，下一个值一定不能比它小，否则出现渲染浪费了
  //       state.bufferedEndIndex
  //     )
  //   : Math.min(bufferedIndexRange.endIndex, maxIndex);
};
