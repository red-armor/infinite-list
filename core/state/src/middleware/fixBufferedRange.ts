// import Dimension from '../../Dimension';
// import ListDimensionsModel from '../../ListDimensionsModel';
// import ListDimensions from '../../ListDimensions';
// import ListGroupDimensions from '../../ListGroupDimensions';
// import { ActionPayload, Ctx, ReducerResult } from '../types/types';
// import { isValidMetaLayout } from '@infinite-list/item-meta';
// import { log } from '@infinite-list/utils';

// // recalculate buffer
// export default <State extends ReducerResult = ReducerResult>(
//   state: State,
//   payload: ActionPayload,
//   ctx: Ctx
// ) => {
//   const { dimension } = payload;

//   const { visibleIndexRange, bufferedIndexRange, maxIndex } = ctx;

//   const maxToRenderPerBatch = dimension.maxToRenderPerBatch;
//   let _nextBufferedEndIndex = bufferedIndexRange.endIndex;

//   if (dimension instanceof ListGroupDimensions) {
//     let count = 0;
//     // start from visibleIndexRange which means the below has high priority
//     // but... if jump to a position, two directions should be considered...
//     for (
//       let startIndex = visibleIndexRange.startIndex;
//       startIndex <= Math.min(_nextBufferedEndIndex, maxIndex);
//       startIndex++
//     ) {
//       const dimensionInfo = dimension.getFinalIndexIndexInfo(startIndex);
//       const currentDimension = dimensionInfo?.dimensions;

//       if (currentDimension instanceof Dimension) {
//         if (currentDimension?.getIgnoredToPerBatch()) continue;
//         const meta = currentDimension.getMeta();
//         if (!isValidMetaLayout(meta)) count++;
//       }

//       if (currentDimension instanceof ListDimensionsModel) {
//         const meta = currentDimension.getIndexItemMeta(
//           dimensionInfo?.index || -1
//         );
//         if (!isValidMetaLayout(meta)) count++;
//       }

//       if (count >= maxToRenderPerBatch) {
//         _nextBufferedEndIndex = startIndex;
//         break;
//       }
//     }
//     ctx.bufferedIndexRange.endIndex = _nextBufferedEndIndex;
//   }

//   if (dimension instanceof ListDimensions) {
//     let count = 0;
//     for (
//       let startIndex = visibleIndexRange.startIndex;
//       startIndex <= Math.min(_nextBufferedEndIndex, maxIndex);
//       startIndex++
//     ) {
//       const meta = dimension.getIndexItemMeta(startIndex);
//       if (!meta) continue;
//       if (!isValidMetaLayout(meta)) count++;

//       if (count >= maxToRenderPerBatch) {
//         _nextBufferedEndIndex = startIndex;
//         break;
//       }
//     }
//     log.info('fixBufferedRange ', _nextBufferedEndIndex);
//     ctx.bufferedIndexRange.endIndex = _nextBufferedEndIndex;
//   }
// };
