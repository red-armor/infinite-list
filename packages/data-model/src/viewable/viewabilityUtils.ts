// import SelectValue from '@x-oasis/select-value';
import { IsItemViewableOptions } from '../deprecate/types';
import ViewabilityItemMeta from './ViewabilityItemMeta';

// export function resolveMeasureMetrics(
//   scrollEventMetrics: ScrollEventMetrics,
//   selectValue: SelectValue
// ) {
//   const { contentOffset, layoutMeasurement, contentSize } = scrollEventMetrics;
//   const contentLength = selectValue.selectLength(contentSize);
//   const scrollOffset = selectValue.selectOffset(contentOffset);
//   const viewportLength = selectValue.selectLength(layoutMeasurement);
//   return {
//     contentLength,
//     scrollOffset,
//     viewportLength,
//   };
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
  viewportLength: number;
  viewAreaMode: boolean;
  viewablePercentThreshold: number;
}) {
  const {
    top,
    bottom,
    itemLength,
    viewportLength,
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
      100 * (viewAreaMode ? pixels / viewportLength : pixels / itemLength);

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
    viewportLength,
    viewablePercentThreshold,
    viewportHeight: (2 * viewport + 1) * viewportLength,
  });

  return value;
}
