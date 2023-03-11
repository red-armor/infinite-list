import ItemMeta from '../ItemMeta';
import SelectValue from '../selectValue/SelectValue';
import { ScrollEventMetrics, ScrollMetrics } from '../types';

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

export function isItemViewable(options: {
  viewport: number;
  itemMeta: ItemMeta;
  scrollMetrics: ScrollMetrics;
  viewAreaMode: boolean;
  viewablePercentThreshold: number;
}) {
  const {
    itemMeta,
    viewport,
    viewAreaMode,
    scrollMetrics,
    viewablePercentThreshold,
  } = options;
  const { offset: scrollOffset, visibleLength: viewportLength } = scrollMetrics;
  if (!itemMeta) return false;
  const itemOffset = itemMeta.getItemOffset();
  const itemLength = itemMeta.getItemLength();

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

/**
 * 获取在视窗中的可见高度
 * @param props
 * @returns
 */
export function _getPixelsVisible(props: {
  top: number;
  bottom: number;
  viewportHeight: number;
}) {
  const { top, bottom, viewportHeight } = props;
  const visibleHeight = Math.min(bottom, viewportHeight) - Math.max(top, 0);
  return Math.max(0, visibleHeight);
}

export function _isEntirelyVisible(props: {
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
    _isEntirelyVisible({
      top,
      bottom,
      viewportHeight,
    })
  ) {
    return true;
  } else {
    const pixels = _getPixelsVisible({
      top,
      bottom,
      viewportHeight,
    });
    const percent =
      100 * (viewAreaMode ? pixels / viewportHeight : pixels / itemLength);
    return viewablePercentThreshold
      ? percent >= viewablePercentThreshold
      : percent > viewablePercentThreshold;
  }
}
