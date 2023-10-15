// import BaseDimensions from '../../BaseDimensions';
// import ListBaseDimensions from '../../ListBaseDimensions';
// import ListGroupDimensions from '../../ListGroupDimensions';
import { ActionPayload, Ctx, ReducerResult } from '../types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { dimension } = payload;
  const maxIndex = dimension.getDataLength() - 1 || 0;

  ctx.maxIndex = maxIndex;
};
