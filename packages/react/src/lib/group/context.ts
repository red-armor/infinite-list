import type { GenericItemT, ListGroupDimensions } from '@infinite-list/data-model';
import noop from '@x-oasis/noop';
import { createContext } from 'react';

type ContextType<ItemT extends GenericItemT> = {
  inspectingTimes: number;
  inspectingTime: number;
  heartBeat: (props: { listKey: string; inspectingTime: number }) => void;
  startInspection: () => void;
  listGroupDimensions?: ListGroupDimensions<ItemT>;
};

// https://stackoverflow.com/a/63852485
const context = createContext<ContextType<any>>({
  inspectingTimes: 0,
  inspectingTime: +Date.now(),
  heartBeat: noop,
  startInspection: noop,
});

export default context;
