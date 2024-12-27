import {
  GenericItemT,
  ListStateResult,
  SpaceStateResult,
} from '@infinite-list/strategies';
import { ListGroupDimensions } from '@infinite-list/group-dimensions';
// import { ScrollComponentUseMeasureLayout } from './ListGroup.types';

export type PortalContextProps<ItemT extends GenericItemT = GenericItemT> = {
  id: string;
  listGroupDimensions: ListGroupDimensions<ItemT>;
  // scrollComponentUseMeasureLayout: ScrollComponentUseMeasureLayout;
};

export type GroupSpaceContentProps<ItemT extends GenericItemT = GenericItemT> =
  {
    state: SpaceStateResult<ItemT>;
    listKey: string;
    ownerId: string;
    dimensions: ListGroupDimensions<ItemT>;
    // scrollComponentUseMeasureLayout: ScrollComponentUseMeasureLayout;
  };

export type GroupRecycleContentProps<
  ItemT extends GenericItemT = GenericItemT
> = {
  state: ListStateResult<ItemT>;
  listKey: string;
  ownerId: string;
  dimensions: ListGroupDimensions<ItemT>;
  // scrollComponentUseMeasureLayout: ScrollComponentUseMeasureLayout;
};
