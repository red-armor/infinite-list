import { IClientRectReadOnly, IRectIntersection } from '../types';

export const computeIntersection = (
  rect1: IClientRectReadOnly | IRectIntersection,
  rect2: IClientRectReadOnly | IRectIntersection
) => {
  const top = Math.max(rect1.top, rect2.top);
  const right = Math.min(rect1.right, rect2.right);
  const bottom = Math.min(rect1.bottom, rect2.bottom);
  const left = Math.max(rect1.left, rect2.left);

  const width = right - left;
  const height = bottom - top;
  /**
   * only if width and height are positive, there is an intersection
   */
  if (width >= 0 && height >= 0) {
    return {
      top,
      right,
      bottom,
      left,
      width,
      height,
    };
  }
  return null;
};

export const isIntersecting = (intersection: IRectIntersection) => {
  return intersection && intersection.width >= 0 && intersection.height >= 0;
};
