// import { BaseContainerProps } from './BaseContainer.types';

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
