export type ScrollMetrics = {
  contentLength: number;
  offset: number;
  visibleLength: number | undefined;

  // not used
  dOffset: number;
  dt: number;
  timestamp: number;
  velocity: number;
};

export type ContentSize = {
  width: number;
  height: number;
};
