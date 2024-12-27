import { GenericItemT } from '@infinite-list/item-meta';
import { ListGroupDimensions } from '@infinite-list/group-dimensions';

import { genericMemo } from '../types';

// https://stackoverflow.com/a/70890101
export const ClockStart = genericMemo(
  <ItemT extends GenericItemT>(props: {
    dimensions: ListGroupDimensions<ItemT>;
    inspectingTimes: number;
  }) => {
    props.dimensions.inspector.startCollection();
    return null;
  }
);
export const ClockEnd = genericMemo(
  <ItemT extends GenericItemT>(props: {
    dimensions: ListGroupDimensions<ItemT>;
    inspectingTimes: number;
  }) => {
    props.dimensions.inspector.terminateCollection();
    return null;
  }
);
