import SelectValue from '@x-oasis/select-value';
import { ScrollEventMetrics, IsItemViewableOptions } from '../types';
import ViewabilityItemMeta from './ViewabilityItemMeta';

export function resolveMeasureMetrics(
  scrollEventMetrics: ScrollEventMetrics,
  selectValue: SelectValue
) {
  const { contentOffset, layoutMeasurement, contentSize } = scrollEventMetrics;
  const contentLength = selectValue.selectLength(contentSize);
  const scrollOffset = selectValue.selectOffset(contentOffset);
  const viewportLength = selectValue.selectLength(layoutMeasurement);
  return {
    contentLength,
    scrollOffset,
    viewportLength,
  };
}

// export function isItemMetaViewable(options: {
//   viewport: number;
//   itemMeta: ItemMeta;
//   scrollMetrics: ScrollMetrics;
//   viewAreaMode?: boolean;
//   viewablePercentThreshold?: number;
// }) {
//   const {
//     itemMeta,
//     viewport,
//     viewAreaMode = false,
//     scrollMetrics,
//     viewablePercentThreshold,
//   } = options;

//   if (!itemMeta || !scrollMetrics) return false;

//   return isItemViewable({
//     itemInfo: {
//       offset: itemMeta.getItemOffset(),
//       length: itemMeta.getItemLength(),
//     },
//     viewport,
//     viewAreaMode,
//     scrollMetrics: {
//       offset: scrollMetrics.offset,
//       visibleLength: scrollMetrics.visibleLength,
//     },
//     viewablePercentThreshold,
//   });
// }

/**
 * 获取在视窗中的可见高度
 * @param props
 * @returns
 */
export function getPixelsVisible(props: {
  top: number;
  bottom: number;
  viewportHeight: number;
}) {
  const { top, bottom, viewportHeight } = props;
  const visibleHeight = Math.min(bottom, viewportHeight) - Math.max(top, 0);
  return Math.max(0, visibleHeight);
}

export function isEntirelyVisible(props: {
  top: number;
  bottom: number;
  viewportHeight: number;
}) {
  const { top, bottom, viewportHeight } = props;
  // 针对比如元素没有高度，但是在视图内，这个时候top和bottom相等都是0
  return top >= 0 && bottom <= viewportHeight && bottom >= top;
}

export function _isViewable(props: {
  top: number;
  bottom: number;
  itemLength: number;
  viewportHeight: number;
  viewAreaMode: boolean;
  viewablePercentThreshold: number;
}) {
  const {
    top,
    bottom,
    itemLength,
    viewportHeight,
    viewAreaMode,
    viewablePercentThreshold,
  } = props;
  if (
    isEntirelyVisible({
      top,
      bottom,
      viewportHeight,
    })
  ) {
    return true;
  } else {
    const pixels = getPixelsVisible({
      top,
      bottom,
      viewportHeight,
    });

    const percent =
      100 * (viewAreaMode ? pixels / viewportHeight : pixels / itemLength);

    // viewablePercentThreshold is 0 on default, so item is viewable even if 1 pixel
    // in viewport.
    return viewablePercentThreshold
      ? percent >= viewablePercentThreshold
      : percent > viewablePercentThreshold;
  }
}

/**
 *
 * @param options
 *    - viewAreaMode false as default, which means it compares with self length.
 *      if value is true, then compare with viewport length.
 *
 * @returns
 */
export function isItemViewable(options: IsItemViewableOptions) {
  const {
    getItemOffset,
    viewabilityItemMeta,
    viewport: _viewport,
    viewAreaMode = false,
    viewabilityScrollMetrics,
    viewablePercentThreshold = 0,
  } = options;

  const { offset: scrollOffset, visibleLength: viewportLength } =
    viewabilityScrollMetrics;
  if (!viewabilityItemMeta) return false;
  const itemOffset =
    typeof getItemOffset === 'function'
      ? getItemOffset(viewabilityItemMeta as ViewabilityItemMeta)
      : viewabilityItemMeta instanceof ViewabilityItemMeta
      ? viewabilityItemMeta.getItemOffset()
      : viewabilityItemMeta.offset;
  const itemLength =
    viewabilityItemMeta instanceof ViewabilityItemMeta
      ? viewabilityItemMeta.getItemLength()
      : viewabilityItemMeta.length;

  const viewport = Math.max(_viewport, 0);
  const top = itemOffset - scrollOffset + viewport * viewportLength;
  const bottom = top + itemLength;

  const value = _isViewable({
    top,
    bottom,
    itemLength,
    viewAreaMode,
    viewablePercentThreshold,
    viewportHeight: (2 * viewport + 1) * viewportLength,
  });

  return value;
}
