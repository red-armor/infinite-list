export * from './BaseDimensions.types';
export * from './BaseLayout.types';
export * from './ItemsDimensions.types';

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
