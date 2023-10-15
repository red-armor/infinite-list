import { ListGroupDimensionsExperimental as ListGroupDimensions } from '@infinite-list/data-model';
import { createContext } from 'react';

const noop = () => {};

export default createContext<{
  inspectingTimes: number;
  inspectingTime: number;
  heartBeat: (props: { listKey: string; inspectingTime: number }) => void;
  startInspection: () => void;
  listGroupDimensions?: ListGroupDimensions;
}>({
  inspectingTimes: 0,
  inspectingTime: +Date.now(),
  heartBeat: noop,
  startInspection: noop,
});
