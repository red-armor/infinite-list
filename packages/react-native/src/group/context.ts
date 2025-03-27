import type { ListGroupDimensions } from '@infinite-list/data-model';
import noop from '@x-oasis/noop';
import { createContext } from 'react';

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
