import { ClientRect, IClientRectReadOnly, ItemLayout } from './types';

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
export function getEmptyIntersection() {
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
  };
}

export const parseRootMargin = function (opt_rootMargin?: string) {
  const marginString = opt_rootMargin || '0';
  const margins = marginString.split(/\s+/).map(function (margin) {
    // const parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);
    const parts = /^(-?\d*\.?\d+)$/.exec(margin);
    console.log('parts ', parts);
    if (!parts) {
      throw new Error('rootMargin must be specified in pixels or percent');
    }
    return { value: parseFloat(parts[1]), unit: parts[2] };
  });
  console.log('margin ', margins);

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

export const convertLayoutToClientRect = (layout: ItemLayout): ClientRect => {
  const { x, y, height, width } = layout;
  return {
    x,
    y,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    width,
    height,
  };
};

export const convertRectToIntersection = (info: IClientRectReadOnly) => {
  const { x, y, ...rest } = info;
  return rest;
};
