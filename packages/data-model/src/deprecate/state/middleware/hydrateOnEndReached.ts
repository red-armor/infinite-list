import { ActionPayload, Ctx, ReducerResult } from '../types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { isEndReached, distanceFromEnd } = payload;

  ctx.isEndReached = isEndReached;
  ctx.distanceFromEnd = distanceFromEnd;
};
