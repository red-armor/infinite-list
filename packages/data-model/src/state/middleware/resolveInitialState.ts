import { ActionPayload, Ctx, ReducerResult } from '../types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { dimension } = payload;

  const initialNumToRender = dimension.initialNumToRender;
  const dataLength = dimension.getDataLength()

  if (initialNumToRender && dimension.getTotalLength()) {

    // ctx.bufferedIndexRange = {
    //   startIndex: 0,
    //   endIndex: Math.min(initialNumToRender, dataLength),
    // };
  }
};
