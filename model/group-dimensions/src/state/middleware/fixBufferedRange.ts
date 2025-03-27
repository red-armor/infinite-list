// import Dimension from '../../Dimension';
// import ListDimensionsModel from '../../ListDimensionsModel';
// import ListDimensions from '../../ListDimensions';
// import { log } from '@infinite-list/utils';
import { Dimension } from '@infinite-list/dimension';
import { ListDimensionsModel } from '@infinite-list/dimensions-model';
import { isValidMetaLayout } from '@infinite-list/item-meta';
import type { ActionPayload, Ctx, ReducerResult } from '@infinite-list/state';

import type ListGroupDimensions from '../../ListGroupDimensions';

// recalculate buffer
export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  // const { dimension } = payload;
  const dimension = payload.dimension as any as ListGroupDimensions;

  const { visibleIndexRange, bufferedIndexRange, maxIndex } = ctx;

  const {maxToRenderPerBatch} = dimension;
  let _nextBufferedEndIndex = bufferedIndexRange.endIndex;

  // if (dimension instanceof ListGroupDimensions) {
  let count = 0;
  // start from visibleIndexRange which means the below has high priority
  // but... if jump to a position, two directions should be considered...
  for (
    let {startIndex} = visibleIndexRange;
    startIndex <= Math.min(_nextBufferedEndIndex, maxIndex);
    startIndex++
  ) {
    const dimensionInfo = dimension.getFinalIndexIndexInfo(startIndex);
    const currentDimension = dimensionInfo?.dimensions;

    if (currentDimension instanceof Dimension) {
      if (currentDimension?.getIgnoredToPerBatch()) continue;
      const meta = currentDimension.getMeta();
      if (!isValidMetaLayout(meta)) count++;
    }

    if (currentDimension instanceof ListDimensionsModel) {
      const meta = currentDimension.getIndexItemMeta(
        dimensionInfo?.index || -1
      );
      if (!isValidMetaLayout(meta)) count++;
    }

    if (count >= maxToRenderPerBatch) {
      _nextBufferedEndIndex = startIndex;
      break;
    }
  }
  ctx.bufferedIndexRange.endIndex = _nextBufferedEndIndex;
  // }
};
