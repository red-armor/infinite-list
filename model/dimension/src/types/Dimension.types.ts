import type { BaseContainerProps } from '@infinite-list/container';

import type { GenericItemT } from './generic.types';
import type { ListGroupChildDimensionsContainer } from './ListGroupDimensions.types';

export type GetDimensionLength = () => number;

export interface DimensionProps<ItemT extends GenericItemT = GenericItemT>
  extends BaseContainerProps {
  recyclerType?: string;
  onRender?: Function;
  ignoredToPerBatch?: boolean;
  container: ListGroupChildDimensionsContainer<ItemT>;
  anchorKey?: string;

  recycleEnabled?: boolean;
  useItemApproximateLength?: boolean;
  itemApproximateLength?: number;

  isFixedLength?: boolean;
  getItemLength?: GetDimensionLength;
}
