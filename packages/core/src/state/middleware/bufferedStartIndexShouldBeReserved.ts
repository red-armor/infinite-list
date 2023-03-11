import { ActionPayload, Ctx, ReducerResult } from '../types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { bufferedIndexRange } = ctx;

  // @ts-ignore
  bufferedIndexRange.startIndex = state.bufferedStartIndex
    ? Math.min(state.bufferedStartIndex, bufferedIndexRange.startIndex)
    : bufferedIndexRange.startIndex;
};
