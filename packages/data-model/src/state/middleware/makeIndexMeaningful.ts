import { ActionPayload, Ctx, ReducerResult } from '../types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { bufferedIndexRange } = ctx;

  // const { startIndex: visibleStartIndex, endIndex: visibleEndIndex } =
  //   visibleIndexRange;
  const { startIndex: bufferedStartIndex, endIndex: bufferedEndIndex } =
    bufferedIndexRange;

  // { visibleEndIndex: 5, visibleStartIndex: -1 } =>  { visibleEndIndex: 5, visibleStartIndex: 0 }
  // { visibleEndIndex: -1, visibleStartIndex: 0 } =>  { visibleEndIndex: -1, visibleStartIndex: -1 }
  // ctx.visibleIndexRange.startIndex = Math.max(visibleStartIndex, 0)
  // visibleEndIndex >= 0 ? Math.max(visibleStartIndex, 0) : -1;

  ctx.bufferedIndexRange.startIndex =
    bufferedEndIndex >= 0 ? Math.max(bufferedStartIndex, 0) : -1;
};
