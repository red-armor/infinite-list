import { BaseContainerProps } from './BaseContainer.types';

export enum BoundInfoType {
  'Hover' = 'hover',
  'OutOfBoundary' = 'outOfBoundary',
}

export type BoundInfo = {
  type: BoundInfoType;
  index: number;
};

export type ItemLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export enum FillingMode {
  SPACE = 'space',
  RECYCLE = 'recycle',
}

export interface BaseLayoutProps extends BaseContainerProps {
  windowSize?: number;
  maxToRenderPerBatch?: number;
  initialNumToRender?: number;
  persistanceIndices?: Array<number>;
  stickyHeaderIndices?: Array<number>;

  recycleThreshold?: number;
  recycleBufferedCount?: number;
  recycleEnabled?: boolean;

  lengthPrecision?: number;

  itemOffsetBeforeLayoutReady?: number;
}
