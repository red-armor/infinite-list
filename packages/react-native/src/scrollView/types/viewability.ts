import {
  ItemsDimensions,
  ListDimensions,
  ListGroupDimensions,
} from '@infinite-list/data-model';

export interface ScrollRectangle {
  left: number;
  top: number;
  bottom: number;
  right: number;
}

export interface ScrollPoint {
  x: number;
  y: number;
}

export interface ScrollVelocity {
  x: number;
  y: number;
}

export interface ScrollSize {
  height: number;
  width: number;
}
export type ScrollEventMetrics = {
  contentInset: ScrollRectangle;
  contentOffset: ScrollPoint;
  contentSize: ScrollSize;
  layoutMeasurement: ScrollSize;
  velocity?: ScrollVelocity | undefined;
  zoomScale: number;
  /**
   * @platform ios
   */
  targetContentOffset?: ScrollPoint | undefined;
};

export type DataModelDimensions =
  | ListDimensions
  | ItemsDimensions
  | ListGroupDimensions;
