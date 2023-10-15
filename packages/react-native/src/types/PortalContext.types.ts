import {
  ListGroupDimensionsExperimental,
  RecycleState,
  SpaceStateResult,
} from '@infinite-list/data-model';
import { ScrollComponentUseMeasureLayout } from './ListGroup.types';

export type PortalContextProps = {
  id: string;
  listGroupDimensions: ListGroupDimensionsExperimental;
  scrollComponentUseMeasureLayout: ScrollComponentUseMeasureLayout;
};

export type GroupSpaceContentProps<T> = {
  state: SpaceStateResult<T>;
  listKey: string;
  ownerId: string;
  dimensions: ListGroupDimensionsExperimental;
  scrollComponentUseMeasureLayout: ScrollComponentUseMeasureLayout;
};

export type GroupRecycleContentProps<T> = {
  state: RecycleState<T>;
  listKey: string;
  ownerId: string;
  dimensions: ListGroupDimensionsExperimental;
  scrollComponentUseMeasureLayout: ScrollComponentUseMeasureLayout;
};
