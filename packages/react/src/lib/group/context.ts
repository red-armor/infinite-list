import { ListGroupDimensions } from '@infinite-list/data-model';
import { createContext } from 'react';
import noop from '@x-oasis/noop';

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
