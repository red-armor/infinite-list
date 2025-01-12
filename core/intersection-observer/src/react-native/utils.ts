export function getEmptyRect() {
  return {
    x: 0,
    y: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
  };
}

export const parseRootMargin = function (opt_rootMargin?: string) {
  const marginString = opt_rootMargin || '0px';
  const margins = marginString.split(/\s+/).map(function (margin) {
    // const parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);
    const parts = /^(-?\d*\.?\d+)$/.exec(margin);
    if (!parts) {
      throw new Error('rootMargin must be specified in pixels or percent');
    }
    return { value: parseFloat(parts[1]), unit: parts[2] };
  });

  // Handles shorthand.
  margins[1] = margins[1] || margins[0];
  margins[2] = margins[2] || margins[0];
  margins[3] = margins[3] || margins[1];

  return margins;
};

/**
 * Tmp
 */
export const defaultViewabilityConfigCallbackPairs = [
  {
    viewabilityConfig: {
      name: 'viewable',
      viewAreaCoveragePercentThreshold: 0,
    },
  },
  {
    viewabilityConfig: {
      name: 'imageViewable',
      viewport: 1,
      viewAreaCoveragePercentThreshold: 0,
    },
  },
];

export const viewabilityConfig = {
  name: 'viewable',
  viewAreaCoveragePercentThreshold: 0,
};
