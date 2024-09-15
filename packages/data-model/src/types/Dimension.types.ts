import ListGroupDimensions from '../ListGroupDimensions';
import { BaseContainerProps } from './BaseContainer.types';

export type GetDimensionLength = () => number

export interface DimensionProps extends BaseContainerProps {
  recyclerType?: string;
  onRender?: Function;
  ignoredToPerBatch?: boolean;
  container: ListGroupDimensions;
  anchorKey?: string;

  recycleEnabled?: boolean
  useItemApproximateLength?: boolean;
  itemApproximateLength?: number;

  getItemLength?: GetDimensionLength
}
