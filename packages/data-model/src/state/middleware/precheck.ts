import { ActionPayload, Ctx, ReducerResult } from '../types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { scrollMetrics } = payload;
  const { contentLength, visibleLength } = scrollMetrics;

  if (!contentLength) {
    console.warn(
      '[infinite-list: data-model] `contentLength` should be given a meaningful' +
        ' value instead of ' +
        `'${contentLength}'`
    );
  }

  if (!visibleLength) {
    console.warn(
      '[infinite-list: data-model] `visibleLength` should be given a meaningful' +
        ' value instead of ' +
        `'${visibleLength}'`
    );
  }
};
