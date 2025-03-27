import type { ListGroupDimensions } from '@infinite-list/group-dimensions';
import type { GenericItemT } from '@infinite-list/item-meta';

// https://stackoverflow.com/a/70890101
export const ClockStart = <ItemT extends GenericItemT>(props: {
  dimensions: ListGroupDimensions<ItemT>;
  inspectingTimes: number;
}) => {
  props.dimensions.inspector.startCollection();
  return null;
};
export const ClockEnd = <ItemT extends GenericItemT>(props: {
  dimensions: ListGroupDimensions<ItemT>;
  inspectingTimes: number;
}) => {
  props.dimensions.inspector.terminateCollection();
  return null;
};
