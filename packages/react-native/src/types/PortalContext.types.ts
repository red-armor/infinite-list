import {
  GenericItemT,
  ListStateResult,
  SpaceStateResult,
  ListGroupDimensions,
} from '@infinite-list/data-model';
import { ScrollComponentUseMeasureLayout } from './ListGroup.types';

export type PortalContextProps = {
  id: string;
  listGroupDimensions: ListGroupDimensions;
  scrollComponentUseMeasureLayout: ScrollComponentUseMeasureLayout;
};

export type GroupSpaceContentProps<ItemT extends GenericItemT = GenericItemT> =
  {
    state: SpaceStateResult<ItemT>;
    listKey: string;
    ownerId: string;
    dimensions: ListGroupDimensions;
    scrollComponentUseMeasureLayout: ScrollComponentUseMeasureLayout;
  };

export type GroupRecycleContentProps<
  ItemT extends GenericItemT = GenericItemT
> = {
  state: ListStateResult<ItemT>;
  listKey: string;
  ownerId: string;
  dimensions: ListGroupDimensions;
  scrollComponentUseMeasureLayout: ScrollComponentUseMeasureLayout;
};
