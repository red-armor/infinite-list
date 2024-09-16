import { ActionPayload, Ctx, ReducerResult } from '../types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { dimension } = payload;

  const initialNumToRender = dimension.initialNumToRender;

  if (initialNumToRender && dimension.getTotalLength()) {
    ctx.visibleIndexRange = {
      startIndex: 0,
      endIndex: 0,
    };
    ctx.bufferedIndexRange = {
      startIndex: 0,
      endIndex: initialNumToRender,
    };
  }
};
