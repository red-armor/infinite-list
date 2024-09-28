import { BaseContainerProps } from './BaseContainer.types';
import { ListGroupDimensionsModelContainer } from './ListGroupDimensions.types';
import { GenericItemT } from './generic.types';

export type GetDimensionLength = () => number;

export interface DimensionProps<ItemT extends GenericItemT = GenericItemT>
  extends BaseContainerProps {
  recyclerType?: string;
  onRender?: Function;
  ignoredToPerBatch?: boolean;
  container: ListGroupDimensionsModelContainer<ItemT>;
  anchorKey?: string;

  recycleEnabled?: boolean;
  useItemApproximateLength?: boolean;
  itemApproximateLength?: number;

  isFixedLength?: boolean;
  getItemLength?: GetDimensionLength;
}
