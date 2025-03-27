import type { ActionPayload, ReducerResult } from '../types/types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload
  // ctx: Ctx
) => {
  const { dimension } = payload;

  const { initialNumToRender } = dimension;
  // const dataLength = dimension.getDataLength()

  if (initialNumToRender && dimension.getTotalLength()) {
    // ctx.bufferedIndexRange = {
    //   startIndex: 0,
    //   endIndex: Math.min(initialNumToRender, dataLength),
    // };
  }
};
