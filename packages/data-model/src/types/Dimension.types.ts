import ListGroupDimensions from '../ListGroupDimensions';
import { BaseContainerProps } from './BaseContainer.types';

export interface DimensionProps extends BaseContainerProps {
  recyclerType?: string;
  onRender?: Function;
  ignoredToPerBatch?: boolean;
  container: ListGroupDimensions;
  anchorKey?: string;
}
