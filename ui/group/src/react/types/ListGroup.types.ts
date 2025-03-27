import type { GenericItemT } from '@infinite-list/types';
import type { RefObject } from 'react';

import type { ListGroupProps as CommonListGroupProps } from '../../types';

// export type ScrollComponentUseMeasureLayout = (
//   itemRef: MutableRefObject<View | null>,
//   options: {
//     onLayout?: Function;
//     getCurrentKey?: () => string;
//     isIntervalTreeItem?: boolean;
//     onMeasureLayout?: Function;
//   }
// ) => {
//   handler: Function;
//   layoutHandler: (e: LayoutChangeEvent) => void;
// };

export type ScrollerRef = RefObject<HTMLDivElement>;

export type ListGroupProps<ItemT extends GenericItemT> =
  CommonListGroupProps<ItemT> & {
    scrollerRef?: ScrollerRef;
  };
