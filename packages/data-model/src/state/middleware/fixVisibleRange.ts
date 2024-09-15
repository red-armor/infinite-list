import Dimension from '../../Dimension';
import ListGroupDimensions from '../../ListGroupDimensions';
import ListDimensionsModel from '../../ListDimensionsModel';
import { ActionPayload, Ctx, ReducerResult } from '../types';
import { isValidMetaLayout } from '../../ItemMeta';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { dimension } = payload;
  const { visibleIndexRange } = ctx;

  if (dimension instanceof ListGroupDimensions) {
    for (
      let startIndex = visibleIndexRange.startIndex;
      startIndex < visibleIndexRange.endIndex;
      startIndex++
    ) {
      const dimensionsInfo = dimension.getFinalIndexIndexInfo(startIndex);
      if (!dimensionsInfo) continue;
      const { dimensions: currentDimensions, index: currentIndex } =
        dimensionsInfo;

      if (currentDimensions instanceof Dimension) {
        // ignore `ignoredToPerBatch` item
        if (currentDimensions?.getIgnoredToPerBatch()) {
          continue;
        }
      }

      if (currentDimensions instanceof ListDimensionsModel) {
        const meta = currentDimensions.getIndexItemMeta(currentIndex);
        if (!isValidMetaLayout(meta)) break;
      }
    }
  }

  ctx.visibleIndexRange.endIndex = visibleIndexRange.startIndex
};
