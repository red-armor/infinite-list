import BaseDimensions from '../../BaseDimensions';
import ListGroupDimensions from '../../ListGroupDimensions';
import { ActionPayload, Ctx, ReducerResult } from '../types';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  let maxIndex = 0;
  const { dimension } = payload;
  if (dimension instanceof BaseDimensions) {
    maxIndex = dimension.length - 1;
  } else if (dimension instanceof ListGroupDimensions) {
    maxIndex = dimension.getDataLength() - 1;
  }

  ctx.maxIndex = maxIndex;
};
