import Dimension from '../../Dimension';
import ListGroupDimensions from '../../ListGroupDimensions';
import ListDimensionsModel from '../../ListDimensionsModel';
import ListDimensions from '../../ListDimensions';
import { ActionPayload, Ctx, ReducerResult } from '../types';
import { isValidMetaLayout } from '../../ItemMeta';
import { info } from '../../utils/logger';

export default <State extends ReducerResult = ReducerResult>(
  state: State,
  payload: ActionPayload,
  ctx: Ctx
) => {
  const { dimension } = payload;
  const { visibleIndexRange } = ctx;
  const { startIndex, endIndex } = visibleIndexRange;
  let nextStartIndex = startIndex;

  if (dimension instanceof ListGroupDimensions) {
    for (nextStartIndex; nextStartIndex < endIndex; nextStartIndex++) {
      const dimensionsInfo = dimension.getFinalIndexIndexInfo(nextStartIndex);
      if (!dimensionsInfo) continue;

      const { dimensions: currentDimensions, index: currentIndex } =
        dimensionsInfo;

      if (currentDimensions instanceof Dimension) {
        // ignore `ignoredToPerBatch` item
        if (currentDimensions?.getIgnoredToPerBatch()) {
          continue;
        }

        const meta = currentDimensions.getMeta();
        if (!isValidMetaLayout(meta)) break;
      }

      if (currentDimensions instanceof ListDimensionsModel) {
        const meta = currentDimensions.getIndexItemMeta(currentIndex);
        if (!isValidMetaLayout(meta)) break;
      }
    }
    if (ctx.visibleIndexRange.endIndex !== nextStartIndex) {
      info(
        'middleware fixVisibleRange endIndex set from ',
        endIndex,
        ' to ',
        nextStartIndex
      );
      ctx.visibleIndexRange.endIndex = nextStartIndex;
    }
  }

  if (dimension instanceof ListDimensions) {
    for (nextStartIndex; nextStartIndex < endIndex; nextStartIndex++) {
      // const meta = dimension.getIndexItemMeta(nextStartIndex);
      // if (!meta) continue;
      // if (!isValidMetaLayout(meta)) break;
    }

    if (ctx.visibleIndexRange.endIndex !== nextStartIndex) {
      info(
        'middleware fixVisibleRange endIndex set from ',
        endIndex,
        ' to ',
        nextStartIndex
      );
      ctx.visibleIndexRange.endIndex = nextStartIndex;
    }
  }
};
