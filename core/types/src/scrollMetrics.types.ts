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

export type ScrollMetrics = {
  contentLength: number;
  offset: number;
  visibleLength: number;

  // not used
  dOffset?: number;
  dt?: number;
  timestamp?: number;
  velocity?: number;
};

export type ContentSize = {
  width: number;
  height: number;
};
